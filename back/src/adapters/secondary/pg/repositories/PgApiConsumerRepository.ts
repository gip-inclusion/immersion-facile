import { sql } from "kysely";
import { InsertObjectOrList } from "kysely/dist/cjs/parser/insert-values-parser";
import { keys, mapObjIndexed } from "ramda";
import {
  ApiConsumer,
  ApiConsumerContact,
  ApiConsumerId,
  ApiConsumerRights,
  DateString,
  Email,
  WebhookSubscription,
  apiConsumerSchema,
  eventToRightName,
} from "shared";
import { ApiConsumerRepository } from "../../../../domain/auth/ports/ApiConsumerRepository";
import {
  KyselyDb,
  cast,
  jsonBuildObject,
  jsonStripNulls,
} from "../kysely/kyselyUtils";
import { Database } from "../kysely/model/database";

export class PgApiConsumerRepository implements ApiConsumerRepository {
  #transaction: KyselyDb;

  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  public async getAll(): Promise<ApiConsumer[]> {
    const results = await this.#pgApiConsumerQueryBuild().execute();

    return results.map((result) =>
      this.#rawPgToApiConsumer(result.raw_api_consumer),
    );
  }

  public async getById(id: ApiConsumerId): Promise<ApiConsumer | undefined> {
    const result = await this.#pgApiConsumerQueryBuild()
      .where("c.id", "=", id)
      .executeTakeFirst();

    return result && this.#rawPgToApiConsumer(result.raw_api_consumer);
  }

  public async save(apiConsumer: ApiConsumer): Promise<void> {
    await this.#insertApiConsumer(apiConsumer);
    await this.#clearSubscriptionsOfConsumer(apiConsumer.id);
    await this.#insertSubscriptions(apiConsumer);
  }

  async #insertApiConsumer(apiConsumer: ApiConsumer) {
    const { rights, ...rest } = apiConsumer;
    const rightsWithoutSubscriptions = mapObjIndexed(
      ({ subscriptions: _, ...rest }) => rest,
      rights,
    );

    const values = {
      id: rest.id,
      consumer: rest.consumer,
      description: rest.description ?? null,
      rights: JSON.parse(JSON.stringify(rightsWithoutSubscriptions)),
      created_at: rest.createdAt,
      expiration_date: rest.expirationDate,
      contact_emails: rest.contact.emails,
      contact_first_name: rest.contact.firstName,
      contact_last_name: rest.contact.lastName,
      contact_job: rest.contact.job,
      contact_phone: rest.contact.phone,
    };

    await this.#transaction
      .insertInto("api_consumers")
      .values(values)
      .onConflict((oc) => oc.column("id").doUpdateSet(values))
      .execute();
  }

  async #clearSubscriptionsOfConsumer(apiConsumerId: ApiConsumerId) {
    await this.#transaction
      .deleteFrom("api_consumers_subscriptions")
      .where("consumer_id", "=", apiConsumerId)
      .execute();
  }

  async #insertSubscriptions(apiConsumer: ApiConsumer) {
    const subscriptions: WebhookSubscription[] = keys(
      apiConsumer.rights,
    ).flatMap((rightName) => apiConsumer.rights[rightName].subscriptions);

    if (subscriptions.length > 0)
      await this.#transaction
        .insertInto("api_consumers_subscriptions")
        .values(
          subscriptions.map(
            (subscription) =>
              ({
                id: subscription.id,
                created_at: sql`${subscription.createdAt}`,
                right_name: eventToRightName(subscription.subscribedEvent),
                callback_url: subscription.callbackUrl,
                callback_headers: JSON.parse(
                  JSON.stringify(subscription.callbackHeaders),
                ),
                consumer_id: apiConsumer.id,
                subscribed_event: subscription.subscribedEvent,
              }) satisfies InsertObjectOrList<
                Database,
                "api_consumers_subscriptions"
              >,
          ),
        )
        .execute();
  }

  #rawPgToApiConsumer({
    subscriptions,
    ...rest
  }: PgRawConsumerData): ApiConsumer {
    const restWithEmptySubscription: Omit<PgRawConsumerData, "subscriptions"> =
      {
        ...rest,
        rights: keys(rest.rights).reduce(
          (acc, rightName) => ({
            ...acc,
            [rightName]: {
              ...rest.rights[rightName],
              subscriptions: [],
            },
          }),
          {},
        ) as ApiConsumerRights,
      };

    const apiConsumer: ApiConsumer = {
      ...restWithEmptySubscription,
      rights: (subscriptions || []).reduce((acc, subscription) => {
        const rightName = eventToRightName(subscription.subscribedEvent);
        return {
          ...acc,
          [rightName]: {
            ...restWithEmptySubscription.rights[rightName],
            subscriptions: [
              ...(acc[rightName].subscriptions || []),
              subscription,
            ],
          },
        };
      }, restWithEmptySubscription.rights),
    };

    return apiConsumerSchema.parse(apiConsumer);
  }

  #pgApiConsumerQueryBuild() {
    return this.#transaction
      .selectFrom("api_consumers as c")
      .leftJoin("api_consumers_subscriptions as s", "s.consumer_id", "c.id")
      .select((eb) =>
        jsonStripNulls(
          jsonBuildObject({
            id: eb.ref("c.id"),
            consumer: eb.ref("c.consumer"),
            description: eb.ref("c.description"),
            rights: cast<ApiConsumerRights>(eb.ref("c.rights")),
            createdAt: sql<DateString>`date_to_iso(c.created_at)`,
            expirationDate: sql<DateString>`date_to_iso(c.expiration_date)`,
            contact: jsonBuildObject({
              firstName: eb.ref("c.contact_first_name"),
              lastName: eb.ref("c.contact_last_name"),
              job: eb.ref("c.contact_job"),
              emails: cast<Email[]>(eb.ref("c.contact_emails")),
              phone: eb.ref("c.contact_phone"),
            }),
            subscriptions: sql<WebhookSubscription[]>`
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'callbackUrl', s.callback_url,
                'callbackHeaders', s.callback_headers,
                'createdAt', date_to_iso(s.created_at),
                'id', s.id,
                'subscribedEvent', s.subscribed_event
              )
            ) FILTER (WHERE s.subscribed_event IS NOT NULL)`,
          }),
        ).as("raw_api_consumer"),
      )
      .groupBy("c.id");
  }
}

type PgRawConsumerData = {
  id: string;
  consumer: string;
  description?: string;
  rights: ApiConsumerRights;
  createdAt: DateString;
  expirationDate: DateString;
  contact: ApiConsumerContact;
  subscriptions: WebhookSubscription[];
};

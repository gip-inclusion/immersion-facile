import { PoolClient } from "pg";
import format from "pg-format";
import { keys, mapObjIndexed } from "ramda";
import {
  ApiConsumer,
  ApiConsumerContact,
  ApiConsumerId,
  ApiConsumerRightName,
  ApiConsumerRights,
  apiConsumerSchema,
  DateIsoString,
  eventToRightName,
  WebhookSubscription,
} from "shared";
import { ApiConsumerRepository } from "../../../../domain/auth/ports/ApiConsumerRepository";

const jsonBuildQuery = `JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
      'id', c.id,
      'consumer', c.consumer,
      'description', c.description,
      'rights', c.rights,
      'createdAt', date_to_iso(c.created_at),
      'expirationDate', date_to_iso(c.expiration_date),
      'contact', JSON_BUILD_OBJECT(
        'firstName', c.contact_first_name,
        'lastName', c.contact_last_name,
        'job', c.contact_job,
        'emails', c.contact_emails,
        'phone', c.contact_phone
      ),
      'subscriptions', JSON_AGG(
        JSON_BUILD_OBJECT(
          'callbackUrl', s.callback_url,
          'callbackHeaders', s.callback_headers,
          'createdAt', date_to_iso(s.created_at),
          'id', s.id,
          'subscribedEvent', s.subscribed_event
        )
      ) FILTER (WHERE s.subscribed_event IS NOT NULL)
    )) as raw_api_consumer
    `;

export class PgApiConsumerRepository implements ApiConsumerRepository {
  constructor(private client: PoolClient) {}

  public async getAll(): Promise<ApiConsumer[]> {
    const result = await this.client.query(`SELECT ${jsonBuildQuery}
        FROM api_consumers c
        LEFT JOIN api_consumers_subscriptions s on s.consumer_id = c.id
        GROUP BY c.id`);
    return result.rows.map((rawPg) => {
      const pgApiConsumer =
        "raw_api_consumer" in rawPg ? rawPg.raw_api_consumer : rawPg;
      return this.#rawPgToApiConsumer(pgApiConsumer);
    });
  }

  public async getById(id: ApiConsumerId): Promise<ApiConsumer | undefined> {
    const result = await this.client.query(
      `SELECT ${jsonBuildQuery}
      FROM api_consumers c
      LEFT JOIN api_consumers_subscriptions s on s.consumer_id = c.id
      WHERE c.id = $1
      GROUP BY
        c.id
      `,
      [id],
    );

    const rawPg = result.rows[0];
    if (!rawPg) return;
    const pgApiConsumer =
      "raw_api_consumer" in rawPg ? rawPg.raw_api_consumer : rawPg;
    return this.#rawPgToApiConsumer(pgApiConsumer);
  }

  public async save(apiConsumer: ApiConsumer): Promise<void> {
    await this.#insertApiConsumer(apiConsumer);
    await this.#clearSubscriptionsOfConsumer(apiConsumer.id);
    await this.#insertSubscriptions(apiConsumer);
  }

  #insertApiConsumer(apiConsumer: ApiConsumer) {
    const { rights, ...rest } = apiConsumer;
    const rightsWithoutSubscriptions = mapObjIndexed(
      ({ subscriptions, ...rest }) => rest,
      rights,
    );
    return this.client.query(
      `
      INSERT INTO api_consumers (
        id, consumer, description, rights, created_at, 
        expiration_date, contact_emails, contact_first_name, contact_last_name, contact_job, 
        contact_phone
      ) VALUES(
        $1, $2, $3, $4, $5, 
        $6, $7, $8, $9, $10,
        $11 
      ) 
      ON CONFLICT (id) DO UPDATE 
      SET (
        id, consumer, description, rights, created_at, 
        expiration_date, contact_emails, contact_first_name, contact_last_name, contact_job, 
        contact_phone
      ) = (
        $1, $2, $3, $4, $5, 
        $6, $7, $8, $9, $10,
        $11 
      )`,
      //prettier-ignore
      [
        rest.id, rest.consumer, rest.description, JSON.stringify(rightsWithoutSubscriptions), rest.createdAt,
        rest.expirationDate, rest.contact.emails, rest.contact.firstName, rest.contact.lastName, rest.contact.job,
        rest.contact.phone,
      ],
    );
  }

  #clearSubscriptionsOfConsumer(apiConsumerId: ApiConsumerId) {
    return this.client.query(
      `
    DELETE FROM api_consumers_subscriptions
    WHERE consumer_id = $1
    `,
      [apiConsumerId],
    );
  }

  #insertSubscriptions(apiConsumer: ApiConsumer) {
    const subscriptions: WebhookSubscription[] = keys(
      apiConsumer.rights,
    ).flatMap(
      (apiConsumerRightName: ApiConsumerRightName) =>
        apiConsumer.rights[apiConsumerRightName].subscriptions,
    );

    if (subscriptions.length === 0) return;

    return this.client.query(
      format(
        `
    INSERT INTO api_consumers_subscriptions(
            id, created_at, right_name, callback_url, callback_headers, consumer_id, subscribed_event
      ) VALUES %L`,
        subscriptions.map((subscription) => [
          subscription.id,
          subscription.createdAt,
          eventToRightName(subscription.subscribedEvent),
          subscription.callbackUrl,
          subscription.callbackHeaders,
          apiConsumer.id,
          subscription.subscribedEvent,
        ]),
      ),
    );
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
}

type PgRawConsumerData = {
  id: string;
  consumer: string;
  description?: string;
  rights: ApiConsumerRights;
  createdAt: DateIsoString;
  expirationDate: DateIsoString;
  contact: ApiConsumerContact;
  subscriptions: WebhookSubscription[];
};

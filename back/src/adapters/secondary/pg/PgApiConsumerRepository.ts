import { PoolClient } from "pg";
import { keys } from "ramda";
import {
  ApiConsumer,
  ApiConsumerContact,
  ApiConsumerId,
  ApiConsumerRights,
  apiConsumerSchema,
  DateIsoString,
  eventToRightName,
  SubscriptionEvent,
  SubscriptionParams,
  WebhookSubscription,
} from "shared";
import { ApiConsumerRepository } from "../../../domain/auth/ports/ApiConsumerRepository";
import { UuidV4Generator } from "../core/UuidGeneratorImplementations";

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
      'subscriptions', JSONB_OBJECT_AGG(
        s.subscribed_event, JSON_BUILD_OBJECT(
          'callbackUrl', s.callback_url,
          'callbackHeaders', s.callback_headers
        )
      ) FILTER (WHERE s.subscribed_event IS NOT NULL)
    )) as raw_api_consumer
    `;

export class PgApiConsumerRepository implements ApiConsumerRepository {
  constructor(private client: PoolClient) {}

  public async addSubscription({
    subscription,
    apiConsumerId,
  }: {
    subscription: WebhookSubscription;
    apiConsumerId: ApiConsumerId;
  }): Promise<void> {
    const apiConsumerRightName = eventToRightName(subscription.subscribedEvent);
    const subscriptionId = new UuidV4Generator().new();
    await this.client.query(
      `
      INSERT INTO api_consumers_subscriptions (id, right_name, consumer_id, subscribed_event, callback_url, callback_headers)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        subscriptionId,
        apiConsumerRightName,
        apiConsumerId,
        subscription.subscribedEvent,
        subscription.callbackUrl,
        subscription.callbackHeaders,
      ],
    );
  }

  public async getAll(): Promise<ApiConsumer[]> {
    const result = await this.client.query(`SELECT ${jsonBuildQuery}
        FROM api_consumers c
        left join api_consumers_subscriptions s on s.consumer_id = c.id
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
      left join api_consumers_subscriptions s on s.consumer_id = c.id
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
    return pgApiConsumer ? this.#rawPgToApiConsumer(pgApiConsumer) : undefined;
  }

  public async save(apiConsumer: ApiConsumer): Promise<void> {
    await this.client.query(
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
        apiConsumer.id, apiConsumer.consumer, apiConsumer.description, JSON.stringify(apiConsumer.rights), apiConsumer.createdAt,
        apiConsumer.expirationDate, apiConsumer.contact.emails, apiConsumer.contact.firstName, apiConsumer.contact.lastName, apiConsumer.contact.job,
        apiConsumer.contact.phone,
      ],
    );
  }

  #rawPgToApiConsumer({
    subscriptions,
    ...rest
  }: PgRawConsumerData): ApiConsumer {
    return apiConsumerSchema.parse({
      ...rest,
      rights: keys(subscriptions).reduce((acc, event) => {
        const rightName = eventToRightName(event);
        return {
          ...acc,
          [rightName]: {
            ...rest.rights[rightName],
            subscriptions: {
              ...rest.rights[rightName].subscriptions,
              [event]: subscriptions[event],
            },
          },
        };
      }, rest.rights),
    });
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
  subscriptions: Record<SubscriptionEvent, SubscriptionParams>;
};

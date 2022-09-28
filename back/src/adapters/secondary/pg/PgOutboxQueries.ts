import { PoolClient } from "pg";
import { groupBy, map, prop, values } from "ramda";
import { pipeWithValue } from "shared";
import { EstablishmentJwtPayload } from "shared";
import { DomainEvent, DomainTopic } from "../../../domain/core/eventBus/events";
import { OutboxQueries } from "../../../domain/core/ports/OutboxQueries";
import { storedEventRowsToDomainEvent } from "./PgOutboxRepository";

export type StoredEventRow = {
  id: string;
  topic: DomainTopic;
  payload: any;
  occurred_at: Date;
  was_quarantined: boolean;
  published_at: Date | null;
  subscription_id: string | null;
  error_message: string | null;
};

export class PgOutboxQueries implements OutboxQueries {
  constructor(private client: PoolClient) {}

  async getAllUnpublishedEvents(): Promise<DomainEvent[]> {
    const { rows } = await this.client.query<StoredEventRow>(`
    SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload,
      outbox_publications.id as publication_id, published_at,
      subscription_id, error_message
    FROM outbox
    LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
    LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
    WHERE was_quarantined = false AND outbox_publications.id IS null
    ORDER BY published_at ASC
    `);

    return convertRowsToDomainEvents(rows);
  }

  async getAllFailedEvents(): Promise<DomainEvent[]> {
    const selectEventIdsWithFailure = `(
      SELECT outbox.id
      FROM outbox_failures
      LEFT JOIN outbox_publications ON outbox_publications.id = outbox_failures.publication_id
      LEFT JOIN outbox ON outbox.id = outbox_publications.event_id
      WHERE outbox.was_quarantined = false
      GROUP BY outbox.id
    )`;

    const selectLatestPublicationIds = `(
      SELECT id FROM (
        SELECT id, event_id, published_at,
        RANK() OVER (PARTITION BY event_id ORDER BY published_at DESC) outbox_rank
        FROM outbox_publications
        WHERE event_id in ${selectEventIdsWithFailure}
      ) as ranked_publications
      WHERE outbox_rank = 1
    )`;

    const selectEventIdsStillFailing = `(
      SELECT outbox_publications.event_id
      FROM outbox_publications
      LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
      WHERE outbox_publications.id IN (select id from ${selectLatestPublicationIds} as latest_publications)
        AND outbox_failures.id IS NOT null 
      GROUP BY outbox_publications.event_id
    )`;

    const { rows } = await this.client.query<StoredEventRow>(`
     SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload,
       outbox_publications.id as publication_id, published_at,
       subscription_id, error_message
     FROM outbox
     LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
     LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
     WHERE outbox.id IN ${selectEventIdsStillFailing}
    `);

    return convertRowsToDomainEvents(rows);
  }

  async getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
    siret: string,
  ): Promise<EstablishmentJwtPayload | undefined> {
    const pgResult = await this.client.query(
      `SELECT payload FROM outbox 
       WHERE topic='FormEstablishmentEditLinkSent' AND payload ->> 'siret' = $1
       ORDER BY occurred_at DESC LIMIT 1`,
      [siret],
    );
    return pgResult.rows[0]?.payload;
  }
}

const convertRowsToDomainEvents = (rows: StoredEventRow[]): DomainEvent[] =>
  pipeWithValue(
    rows,
    groupBy(prop("id")),
    values,
    map(storedEventRowsToDomainEvent),
  );

import { groupBy, map, prop, values } from "ramda";
import { pipeWithValue } from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../config/pg/kysely/kyselyUtils";
import { DomainEvent } from "../events";
import { OutboxQueries } from "../ports/OutboxQueries";
import {
  StoredEventRow,
  storedEventRowsToDomainEvent,
} from "./PgOutboxRepository";

export class PgOutboxQueries implements OutboxQueries {
  constructor(private transaction: KyselyDb) {}

  public async getFailedEvents(params: { limit: number }): Promise<
    DomainEvent[]
  > {
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

    const { rows } = await executeKyselyRawSqlQuery<StoredEventRow>(
      this.transaction,
      `
     SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload, status,
       outbox_publications.id as publication_id, published_at,
       subscription_id, error_message
     FROM outbox
     LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
     LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
     WHERE outbox.id IN ${selectEventIdsStillFailing}
     ORDER BY outbox_failures.subscription_id ASC
     LIMIT ${params.limit}
    `,
    );

    return convertRowsToDomainEvents(rows);
  }

  public async getAllUnpublishedEvents(params: { limit: number }): Promise<
    DomainEvent[]
  > {
    const { rows } = await executeKyselyRawSqlQuery<StoredEventRow>(
      this.transaction,
      `
    SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload, status,
      outbox_publications.id as publication_id, published_at,
      subscription_id, error_message
    FROM outbox
    LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
    LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
    WHERE was_quarantined = false AND status IN ('never-published', 'to-republish')
    ORDER BY published_at ASC
    LIMIT ${params.limit}
    `,
    );

    return convertRowsToDomainEvents(rows);
  }
}

const convertRowsToDomainEvents = (rows: StoredEventRow[]): DomainEvent[] =>
  pipeWithValue(
    rows,
    groupBy(prop("id")),
    values,
    map(storedEventRowsToDomainEvent),
  );

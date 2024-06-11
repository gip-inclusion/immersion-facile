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
    const results = await this.transaction
      .with("ranked_publications", (eb) =>
        eb
          .selectFrom("outbox_publications")
          .select(({ fn }) => [
            "outbox_publications.id",
            "outbox_publications.event_id",
            "outbox_publications.published_at",
            fn
              .agg<number>("rank")
              .over((ob) =>
                ob
                  .partitionBy("outbox_publications.event_id")
                  .orderBy("outbox_publications.published_at", "desc"),
              )
              .as("outbox_rank"),
          ])
          .whereRef("event_id", "in", ({ selectFrom }) =>
            selectFrom("outbox_failures")
              .leftJoin(
                "outbox_publications",
                "outbox_publications.id",
                "publication_id",
              )
              .leftJoin("outbox", "outbox.id", "event_id")
              .select("outbox.id")
              .where("was_quarantined", "=", false)
              .groupBy("outbox.id"),
          ),
      )
      .selectFrom("outbox")
      .leftJoin(
        "outbox_publications",
        "outbox.id",
        "outbox_publications.event_id",
      )
      .leftJoin(
        "outbox_failures",
        "outbox_publications.id",
        "outbox_failures.publication_id",
      )
      .select([
        "outbox.id as id",
        "outbox.occurred_at",
        "outbox.was_quarantined",
        "outbox.topic",
        "outbox.payload",
        "outbox.status",
        "outbox_publications.id as publication_id",
        "outbox_publications.published_at",
        "outbox_failures.subscription_id",
        "error_message",
      ])
      .where("outbox.id", "in", ({ selectFrom }) =>
        selectFrom("outbox_publications")
          .select("event_id")
          .leftJoin(
            "outbox_failures",
            "outbox_failures.publication_id",
            "outbox_publications.id",
          )
          .where("outbox_publications.id", "in", ({ selectFrom }) =>
            selectFrom("ranked_publications")
              .select("ranked_publications.id")
              .where("outbox_rank", "=", 1),
          )
          .where("outbox_failures.id", "is not", null)
          .groupBy("outbox_publications.event_id"),
      )
      .orderBy([
        "outbox.occurred_at",
        "outbox_publications.published_at",
        "outbox_failures.subscription_id",
        "outbox_failures.id",
      ])
      .limit(params.limit)
      .execute();

    return convertRowsToDomainEvents(results as StoredEventRow[]);
  }

  public async getEventsToPublish(params: { limit: number }): Promise<
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
          ORDER BY occurred_at ASC
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

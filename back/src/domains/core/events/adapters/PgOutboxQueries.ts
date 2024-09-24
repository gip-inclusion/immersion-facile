import { groupBy, isNil, map, prop, reject, values } from "ramda";
import { pipeWithValue } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
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
    const results = await this.#getEventsQueryBuilder()
      .where("status", "=", "failed-but-will-retry")
      .limit(params.limit)
      .execute();

    return convertRowsToDomainEvents(results as StoredEventRow[]);
  }

  public async getEventsToPublish(params: { limit: number }): Promise<
    DomainEvent[]
  > {
    const results = await this.#getEventsQueryBuilder()
      .where("status", "in", ["never-published", "to-republish"])
      .limit(params.limit)
      .execute();

    return convertRowsToDomainEvents(results as StoredEventRow[]);
  }

  #getEventsQueryBuilder() {
    return this.transaction
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
        "occurred_at",
        "was_quarantined",
        "topic",
        "payload",
        "status",
        "outbox_publications.id as publication_id",
        "published_at",
        "subscription_id",
        "error_message",
      ])
      .where("was_quarantined", "=", false)
      .orderBy("occurred_at asc");
  }
}

const convertRowsToDomainEvents = (rows: StoredEventRow[]): DomainEvent[] =>
  pipeWithValue(
    rows,
    groupBy(prop("id")),
    values,
    reject(isNil),
    map(storedEventRowsToDomainEvent),
  );

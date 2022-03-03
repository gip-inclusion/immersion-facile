import { PoolClient } from "pg";
import promClient from "prom-client";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { EditFormEstablishmentPayload } from "../../../shared/tokens/MagicLinkPayload";

const counterEventsSaved = new promClient.Counter({
  name: "pg_outbox_repository_events_saved",
  help: "The total count of events saved by PgOutboxRepository.",
  labelNames: ["topic", "wasQuarantined"],
});

const counterEventsMarkedAsPublished = new promClient.Counter({
  name: "pg_outbox_repository_events_marked_as_published",
  help: "The total count of events marked as published by PgOutboxRepository.",
  labelNames: ["topic"],
});

export class PgOutboxRepository implements OutboxRepository {
  constructor(private client: PoolClient) {}

  async getAllUnpublishedEvents(): Promise<DomainEvent[]> {
    return this.client
      .query(
        `SELECT id, TO_CHAR(occurred_at, 'YYYY-MM-DD"T"HH:MI:SS.MS"Z"') as "occurredAt",
          was_published as "wasPublished", was_quarantined as "wasQuarantined",
          topic, payload
        FROM outbox
        WHERE was_published = false
          AND was_quarantined = false
        ORDER BY occurred_at ASC`,
      )
      .then(({ rows }) => rows);
  }

  async save(event: DomainEvent): Promise<void> {
    const { id, occurredAt, wasPublished, wasQuarantined, topic, payload } =
      event;
    const query = `INSERT INTO outbox(
        id, occurred_at, was_published, was_quarantined, topic, payload
      ) VALUES($1, $2, $3, $4, $5, $6)`;

    // prettier-ignore
    await this.client.query(query, [id, occurredAt, wasPublished, wasQuarantined, topic, payload]);

    counterEventsSaved.inc({
      topic,
      wasQuarantined: wasQuarantined ? "true" : "false",
    });
  }

  async getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
    siret: string,
  ): Promise<EditFormEstablishmentPayload | undefined> {
    const pgResult = await this.client.query(
      `SELECT payload FROM outbox 
       WHERE topic='FormEstablishmentEditLinkSent' AND payload ->> 'siret' = $1
       ORDER BY occurred_at DESC LIMIT 1`,
      [siret],
    );
    return pgResult.rows[0]?.payload;
  }

  async markEventsAsPublished(events: DomainEvent[]): Promise<void> {
    const idsToMarkAsPublished = events.map(({ id }) => id);

    await this.client.query(
      "UPDATE outbox SET was_published = true WHERE id = ANY($1::uuid[])",
      [idsToMarkAsPublished],
    );

    events.forEach(({ topic }) =>
      counterEventsMarkedAsPublished.inc({ topic }),
    );
  }
}

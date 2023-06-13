import { PoolClient } from "pg";
import { differenceWith } from "ramda";
import { DateIsoString, propEq, replaceArrayElement } from "shared";
import {
  DomainEvent,
  DomainTopic,
  EventFailure,
  EventPublication,
} from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { counterEventsSavedBeforePublish } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";

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

const logger = createLogger(__filename);

export class PgOutboxRepository implements OutboxRepository {
  constructor(private client: PoolClient) {}

  async save(event: DomainEvent): Promise<void> {
    const eventInDb = await this.storeEventInOutboxOrRecoverItIfAlreadyThere(
      event,
    );

    const newPublications = differenceWith(
      (dbEvent, newEvent) => dbEvent.publishedAt === newEvent.publishedAt,
      event.publications,
      eventInDb.publications,
    );

    await Promise.all(
      newPublications.map((publication) =>
        this.saveNewPublication(event.id, publication),
      ),
    );

    if (event.publications.length === 0) {
      counterEventsSavedBeforePublish.inc({
        topic: event.topic,
        wasQuarantined: event.wasQuarantined.toString(),
      });
      logger.info(
        { topic: event.topic, wasQuarantined: event.wasQuarantined.toString() },
        "eventsSavedBeforePublish",
      );
    }
  }

  private async storeEventInOutboxOrRecoverItIfAlreadyThere(
    event: DomainEvent,
  ): Promise<DomainEvent> {
    const { id, occurredAt, wasQuarantined, topic, payload } = event;

    const eventAlreadyInDb = await this.getEventById(event.id);
    if (eventAlreadyInDb) {
      if (eventAlreadyInDb.wasQuarantined === event.wasQuarantined) {
        return eventAlreadyInDb;
      }

      await this.client.query(
        "UPDATE outbox SET was_quarantined = $2 WHERE id = $1",
        [id, wasQuarantined],
      );
      return { ...eventAlreadyInDb, wasQuarantined: event.wasQuarantined };
    }

    const query = `INSERT INTO outbox(
        id, occurred_at, was_quarantined, topic, payload
      ) VALUES($1, $2, $3, $4, $5)`;

    await this.client.query(query, [
      id,
      occurredAt,
      wasQuarantined,
      topic,
      payload,
    ]);

    return { ...event, publications: [] }; // publications will be added after in process
  }

  private async saveNewPublication(
    eventId: string,
    { publishedAt, failures }: EventPublication,
  ) {
    const { rows } = await this.client.query(
      "INSERT INTO outbox_publications(event_id, published_at) VALUES($1, $2) RETURNING id",
      [eventId, publishedAt],
    );

    const publicationId = rows[0].id;

    await Promise.all(
      failures.map(({ subscriptionId, errorMessage }) =>
        this.client.query(
          "INSERT INTO outbox_failures(publication_id, subscription_id, error_message) VALUES($1, $2, $3)",
          [publicationId, subscriptionId, errorMessage],
        ),
      ),
    );
  }

  private async getEventById(id: string): Promise<DomainEvent | undefined> {
    const { rows } = await this.client.query<StoredEventRow>(
      `
        SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload,
          outbox_publications.id as publication_id, published_at,
          subscription_id, error_message 
        FROM outbox
        LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
        LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
        WHERE outbox.id = $1
        ORDER BY published_at ASC
      `,
      [id],
    );
    if (!rows.length) return;
    return storedEventRowsToDomainEvent(rows);
  }
}

export const storedEventRowsToDomainEvent = (
  eventRowsForEvent: StoredEventRow[],
): DomainEvent =>
  eventRowsForEvent.reduce(
    (acc, row): DomainEvent => {
      if (!row.published_at) {
        return {
          ...storedEventOutboxToDomainEvent(row),
          publications: [...acc.publications],
        };
      }

      const publishedAt: DateIsoString = row.published_at.toISOString();

      const existingPublicationIndex = acc.publications.findIndex(
        propEq("publishedAt", publishedAt),
      );

      const existingPublication: EventPublication | undefined =
        acc.publications[existingPublicationIndex];

      if (!existingPublication) {
        const failures: EventFailure[] = row.subscription_id
          ? [
              {
                subscriptionId: row.subscription_id,
                errorMessage: row.error_message ?? "",
              },
            ]
          : [];

        return {
          ...storedEventOutboxToDomainEvent(row),
          publications: [...acc.publications, { publishedAt, failures }],
        };
      }

      const failures: EventFailure[] = [
        ...existingPublication.failures,
        ...(row.subscription_id
          ? [
              {
                subscriptionId: row.subscription_id,
                errorMessage: row.error_message ?? "",
              },
            ]
          : []),
      ];

      const updatedPublication: EventPublication = {
        ...existingPublication,
        failures,
      };

      return {
        ...storedEventOutboxToDomainEvent(row),
        publications: replaceArrayElement(
          acc.publications,
          existingPublicationIndex,
          updatedPublication,
        ),
      };
    },
    { publications: [] } as unknown as DomainEvent,
  );

export const storedEventOutboxToDomainEvent = (
  row: StoredEventRow,
): DomainEvent => ({
  id: row.id,
  topic: row.topic as any, //this is to avoid the error due to : https://github.com/microsoft/TypeScript/issues/42518
  occurredAt: row.occurred_at.toISOString(),
  payload: row.payload,
  wasQuarantined: row.was_quarantined,
  publications: [],
});

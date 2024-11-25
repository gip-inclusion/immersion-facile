import { differenceWith, propEq } from "ramda";
import { DateString, replaceArrayElement } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../utils/logger";
import type {
  DomainEvent,
  DomainTopic,
  EventFailure,
  EventPublication,
  EventStatus,
} from "../events";
import { OutboxRepository } from "../ports/OutboxRepository";

export type StoredEventRow = {
  id: string;
  topic: DomainTopic;
  payload: any;
  occurred_at: Date;
  was_quarantined: boolean;
  published_at: Date | null;
  subscription_id: string | null;
  error_message: string | null;
  status: EventStatus;
};

const logger = createLogger(__filename);

export class PgOutboxRepository implements OutboxRepository {
  constructor(private transaction: KyselyDb) {}

  public async countAllEvents({
    status,
  }: { status: EventStatus }): Promise<number> {
    const result = (await this.transaction
      .selectFrom("outbox")
      .select((eb) => eb.fn.countAll().as("total"))
      .where("status", "=", status)
      .executeTakeFirst()) as { total: string };

    return parseInt(result.total);
  }

  public async markEventsAsInProcess(events: DomainEvent[]): Promise<void> {
    if (events.length)
      await this.transaction
        .updateTable("outbox")
        .set({
          status: "in-process",
        })
        .where(
          "id",
          "in",
          events.map(({ id }) => id),
        )
        .execute();
  }

  public async save(event: DomainEvent): Promise<void> {
    const eventInDb =
      await this.#storeEventInOutboxOrRecoverItIfAlreadyThere(event);

    const newPublications = differenceWith(
      (dbEvent, newEvent) => dbEvent.publishedAt === newEvent.publishedAt,
      event.publications,
      eventInDb.publications,
    );

    await Promise.all(
      newPublications.map((publication) =>
        this.#saveNewPublication(event.id, publication),
      ),
    );

    if (event.publications.length === 0) {
      logger.info({
        topic: event.topic,
        events: [event],
        message: "eventsSavedBeforePublish",
      });
    }
  }

  async #storeEventInOutboxOrRecoverItIfAlreadyThere(
    event: DomainEvent,
  ): Promise<DomainEvent> {
    const { id, occurredAt, wasQuarantined, topic, payload, status } = event;

    const eventAlreadyInDb = await this.#getEventById(event.id);
    if (eventAlreadyInDb) {
      await this.transaction
        .updateTable("outbox")
        .set({
          was_quarantined: wasQuarantined,
          status,
        })
        .where("id", "=", id)
        .execute();
      return { ...eventAlreadyInDb, wasQuarantined: event.wasQuarantined };
    }

    const builder = this.transaction.insertInto("outbox").values({
      id,
      occurred_at: occurredAt,
      was_quarantined: wasQuarantined,
      topic,
      payload: JSON.stringify(payload),
      status,
    });

    await builder.execute();

    return { ...event, publications: [] }; // publications will be added after in process
  }

  async #saveNewPublication(
    eventId: string,
    { publishedAt, failures }: EventPublication,
  ) {
    const results = await this.transaction
      .insertInto("outbox_publications")
      .values({ event_id: eventId, published_at: publishedAt })
      .returning("id")
      .execute();

    const publicationId = results.at(0)?.id;

    if (!publicationId)
      throw new Error(`saveNewPublication of event ${eventId} failed`);

    if (failures.length === 0) return;

    await this.transaction
      .insertInto("outbox_failures")
      .values(
        failures.map(({ subscriptionId, errorMessage }) => ({
          publication_id: publicationId,
          subscription_id: subscriptionId,
          error_message: errorMessage,
        })),
      )
      .execute();
  }

  async #getEventById(id: string): Promise<DomainEvent | undefined> {
    const results = await this.transaction
      .selectFrom("outbox")
      .leftJoin("outbox_publications", "outbox.id", "event_id")
      .leftJoin("outbox_failures", "outbox_publications.id", "publication_id")
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
      .where("outbox.id", "=", id)
      .orderBy("published_at asc")
      .execute();

    return !results.length
      ? undefined
      : storedEventRowsToDomainEvent(results as StoredEventRow[]);
  }
}

export const storedEventRowsToDomainEvent = (
  eventRowsForEvent: StoredEventRow[],
): DomainEvent => {
  const event = eventRowsForEvent.reduce(
    (acc, row): DomainEvent => {
      if (!row.published_at) {
        return {
          ...storedEventOutboxToDomainEvent(row),
          publications: [...acc.publications],
        };
      }

      const publishedAt: DateString = row.published_at.toISOString();

      const existingPublicationIndex = acc.publications.findIndex(
        propEq(publishedAt, "publishedAt"),
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

      // reorder failures by subscriptionId
      failures.sort((a, b) => a.subscriptionId.localeCompare(b.subscriptionId));

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

  event.publications.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  return event;
};

const storedEventOutboxToDomainEvent = (row: StoredEventRow): DomainEvent => ({
  id: row.id,
  topic: row.topic as any, //this is to avoid the error due to : https://github.com/microsoft/TypeScript/issues/42518
  occurredAt: row.occurred_at.toISOString(),
  payload: row.payload,
  wasQuarantined: row.was_quarantined,
  publications: [],
  status: row.status,
});

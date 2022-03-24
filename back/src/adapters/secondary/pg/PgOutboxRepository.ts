import { PoolClient } from "pg";
import promClient from "prom-client";
import { differenceWith, groupBy, map, prop, values } from "ramda";
import {
  DomainEvent,
  DomainTopic,
  EventFailure,
  EventPublication,
} from "../../../domain/core/eventBus/events";
import { DateStr } from "../../../domain/core/ports/Clock";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { pipeWithValue } from "../../../shared/pipeWithValue";
import { propEq } from "../../../shared/ramdaExtensions/propEq";
import { EstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
import { replaceArrayElement } from "../../../shared/utils";

const counterEventsSaved = new promClient.Counter({
  name: "pg_outbox_repository_events_saved",
  help: "The total count of events saved by PgOutboxRepository.",
  labelNames: ["topic", "wasQuarantined"],
});

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

    counterEventsSaved.inc({
      topic: event.topic,
      wasQuarantined: event.wasQuarantined.toString(),
    });
  }

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

  private async storeEventInOutboxOrRecoverItIfAlreadyThere(
    event: DomainEvent,
  ): Promise<DomainEvent> {
    const { id, occurredAt, wasQuarantined, topic, payload } = event;

    const eventAlreadyInDb = await this.getEventById(event.id);
    if (eventAlreadyInDb) return eventAlreadyInDb;

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

const convertRowsToDomainEvents = (rows: StoredEventRow[]): DomainEvent[] =>
  pipeWithValue(
    rows,
    groupBy(prop("id")),
    values,
    map(storedEventRowsToDomainEvent),
  );

const storedEventRowsToDomainEvent = (
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

      const publishedAt: DateStr = row.published_at.toISOString();

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

const storedEventOutboxToDomainEvent = (row: StoredEventRow): DomainEvent => ({
  id: row.id,
  topic: row.topic,
  occurredAt: row.occurred_at.toISOString(),
  payload: row.payload,
  wasQuarantined: row.was_quarantined,
  publications: [],
});

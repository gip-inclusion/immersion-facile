import { Pool, PoolClient } from "pg";
import { expectObjectsToMatch, expectToEqual } from "shared";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { createPgUow } from "../../unit-of-work/adapters/createPgUow";
import type { DomainEvent, EventPublication } from "../events";
import { InMemoryEventBus } from "./InMemoryEventBus";
import {
  PgOutboxRepository,
  StoredEventRow,
  storedEventRowsToDomainEvent,
} from "./PgOutboxRepository";

const domainEvt: DomainEvent = {
  id: "11111111-1111-4111-1111-111111111111",
  topic: "AssessmentCreated",
  payload: {
    assessment: {
      status: "FINISHED",
      conventionId: "a convention id",
      establishmentFeedback: "Super top",
    },
  },
  occurredAt: "a date",
  wasQuarantined: false,
  status: "never-published",
  publications: [],
};

describe("when simulating that an event has failed to force re-run it only for one usecase", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("republishes only the subscription that has failed", async () => {
    // Arrange

    const kyselyDb = makeKyselyDb(pool);

    await client.query("DELETE FROM outbox_failures");
    await client.query("DELETE FROM outbox_publications");
    await client.query("DELETE FROM outbox");

    const timeGateway = new CustomTimeGateway();
    const eventBus = new InMemoryEventBus(
      timeGateway,
      new InMemoryUowPerformer(createPgUow(kyselyDb)),
    );
    const outboxRepository = new PgOutboxRepository(kyselyDb);

    const subscriptionId = "failedSubscription";

    const failedPublication: EventPublication = {
      publishedAt: new Date("2024-06-10T13:00:00Z").toISOString(),
      failures: [
        {
          subscriptionId,
          errorMessage: "Just to re-run this subscription",
        },
      ],
    };
    const firstPublication: EventPublication = {
      publishedAt: new Date("2024-06-10T12:00:00Z").toISOString(),
      failures: [],
    };

    const publications = [firstPublication, failedPublication];
    const initialEvent: DomainEvent = {
      ...domainEvt,
      occurredAt: new Date("2024-06-10T13:00:00Z").toISOString(),
      status: "failed-but-will-retry",
      wasQuarantined: false,
      publications: publications,
    };

    await outboxRepository.save(initialEvent);
    expectToEqual(
      storedEventRowsToDomainEvent(await getAllEventsStored(client)),
      initialEvent,
    );

    // Act
    eventBus.subscribe(initialEvent.topic, subscriptionId, async (_) => {});
    const publishedAt = new Date("2024-06-10T14:00:00Z");
    timeGateway.setNextDate(publishedAt);
    await eventBus.publish(initialEvent);

    // Assert
    expectObjectsToMatch(
      storedEventRowsToDomainEvent(await getAllEventsStored(client)),
      {
        status: "published",
        publications: [
          firstPublication,
          failedPublication,
          { publishedAt: publishedAt.toISOString(), failures: [] },
        ],
      },
    );
  });
});

const getAllEventsStored = (client: PoolClient): Promise<StoredEventRow[]> =>
  client
    .query(
      `
        SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload, status,
          published_at, subscription_id, error_message 
        FROM outbox  
        LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
        LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
      `,
    )
    .then((result) => result.rows);

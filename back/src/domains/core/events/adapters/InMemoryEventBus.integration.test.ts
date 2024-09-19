import { CompiledQuery } from "kysely";
import { Pool } from "pg";
import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { createGetAppellationsByCode } from "../../../establishment/adapters/PgEstablishmentAggregateRepository";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { createPgUow } from "../../unit-of-work/adapters/createPgUow";
import type { DomainEvent, EventPublication } from "../events";
import { EventBus } from "../ports/EventBus";
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
    triggeredBy: {
      kind: "inclusion-connected",
      userId: "user-123",
    },
  },
  occurredAt: "a date",
  wasQuarantined: false,
  status: "never-published",
  publications: [],
};

describe("when simulating that an event has failed to force re-run it only for one usecase", () => {
  let pool: Pool;
  let db: KyselyDb;
  let timeGateway: CustomTimeGateway;
  let eventBus: EventBus;
  let outboxRepository: PgOutboxRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    timeGateway = new CustomTimeGateway();
    eventBus = new InMemoryEventBus(
      timeGateway,
      new InMemoryUowPerformer(
        createPgUow(db, createGetAppellationsByCode(db)),
      ),
    );
    outboxRepository = new PgOutboxRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();
  });

  it("republishes only the subscription that has failed", async () => {
    // Arrange

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
      storedEventRowsToDomainEvent(await getAllEventsStored(db)),
      initialEvent,
    );

    // Act
    eventBus.subscribe(initialEvent.topic, subscriptionId, async (_) => {});
    const publishedAt = new Date("2024-06-10T14:00:00Z");
    timeGateway.setNextDate(publishedAt);
    await eventBus.publish(initialEvent);

    // Assert
    expectObjectsToMatch(
      storedEventRowsToDomainEvent(await getAllEventsStored(db)),
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

const getAllEventsStored = (db: KyselyDb): Promise<StoredEventRow[]> =>
  db
    .executeQuery(
      CompiledQuery.raw(`
        SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload, status,
          published_at, subscription_id, error_message 
        FROM outbox  
        LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
        LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
      `),
    )
    .then((results) => results.rows as StoredEventRow[]);

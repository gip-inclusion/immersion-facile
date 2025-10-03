import { subHours } from "date-fns";
import { CompiledQuery } from "kysely";
import type { Pool } from "pg";
import {
  ConventionDtoBuilder,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { DomainEvent, DomainTopic } from "../events";
import { makeCreateNewEvent } from "../ports/EventBus";
import { PgOutboxRepository, type StoredEventRow } from "./PgOutboxRepository";

describe("PgOutboxRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let outboxRepository: PgOutboxRepository;
  const uuidGenerator = new TestUuidGenerator();
  const timeGateway = new CustomTimeGateway();
  const quarantinedTopic: DomainTopic = "ConventionRejected";

  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    timeGateway,
    quarantinedTopics: [quarantinedTopic],
  });

  beforeAll(async () => {
    pool = makeTestPgPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    db = makeKyselyDb(pool);

    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();

    outboxRepository = new PgOutboxRepository(db);
  });

  it("countAllEvents", async () => {
    const common = {
      occurred_at: "2021-11-15T08:30:00.000Z",
      topic: "PeConnectFederatedIdentityAssociated",
      payload:
        '{"exp": 1652054423, "iat": 1651881623, "siret": "my-siret", "version": 1}',
    };

    await db
      .insertInto("outbox")
      .values({
        id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa",
        status: "never-published",
        ...common,
      })
      .execute();
    await db
      .insertInto("outbox")
      .values({
        id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38cccc",
        status: "never-published",
        ...common,
      })
      .execute();
    await db
      .insertInto("outbox")
      .values({
        id: "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38bbbb",
        status: "in-process",
        ...common,
      })
      .execute();

    expectToEqual(
      await outboxRepository.countAllEvents({
        status: "never-published",
      }),
      2,
    );
  });

  describe("saveNewEventsBatch", () => {
    it("does nothing when array of event is empty", async () => {
      await outboxRepository.saveNewEventsBatch([]);
      // (should not throw)
    });

    it("saves a new event to be processed, then adds a failing publication, then a working one", async () => {
      const conventionEventId = "aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa";
      const discussionEventId = "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
      uuidGenerator.setNextUuids([conventionEventId, discussionEventId]);

      const convention = new ConventionDtoBuilder().build();
      const event1 = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
      });
      const event2 = createNewEvent({
        topic: "DiscussionMarkedAsDeprecated",
        payload: { discussionId: "discussionId", triggeredBy: null },
      });

      await outboxRepository.saveNewEventsBatch([event1, event2]);

      const resultsInDb = await db.selectFrom("outbox").selectAll().execute();
      const conventionEvent = resultsInDb.find(
        ({ topic }) => topic === "ConventionSubmittedByBeneficiary",
      );
      const discussionEvent = resultsInDb.find(
        ({ topic }) => topic === "DiscussionMarkedAsDeprecated",
      );

      if (!conventionEvent || !discussionEvent)
        throw new Error("Event not found in db");

      expectToEqual(conventionEvent, {
        id: conventionEventId,
        status: "never-published",
        priority: null,
        topic: "ConventionSubmittedByBeneficiary",
        occurred_at: expect.any(Date),
        was_quarantined: false,
        payload: { convention, triggeredBy: null },
      });

      expectToEqual(discussionEvent, {
        id: discussionEventId,
        status: "never-published",
        priority: null,
        topic: "DiscussionMarkedAsDeprecated",
        occurred_at: expect.any(Date),
        was_quarantined: false,
        payload: { discussionId: "discussionId", triggeredBy: null },
      });
    });
  });

  describe("save", () => {
    it("saves an event with published data", async () => {
      const convention = new ConventionDtoBuilder().build();
      timeGateway.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
      uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
      const alreadyProcessedEvent = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
        publications: [
          { publishedAt: "2021-11-15T08:30:00.000Z", failures: [] },
        ],
        status: "published",
      });

      // act
      await outboxRepository.save(alreadyProcessedEvent);

      // assert
      const storedEventRows = await getAllEventsStored();
      expect(storedEventRows).toHaveLength(1);
      expectStoredRowsToMatchEvent(storedEventRows, alreadyProcessedEvent);
    });

    it("saves a new event to be processed, then adds a failing publication, then a working one", async () => {
      // prepare
      uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
      const convention = new ConventionDtoBuilder().build();
      const event = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
        priority: 1,
      });

      // act (when event does not exist in db)
      await outboxRepository.save(event);

      // assert
      const storedEventRows = await getAllEventsStored();

      expect(storedEventRows).toHaveLength(1);
      expectStoredRowsToMatchEvent(storedEventRows, event);

      // prepare
      const failingPublicationEvent: DomainEvent = {
        ...event,
        publications: [
          {
            publishedAt: new Date("2022-01-01").toISOString(),
            failures: [{ subscriptionId: "sub1", errorMessage: "has failed" }],
          },
        ],
        status: "failed-but-will-retry",
      };

      // act (when event already exist, and the publication has failures)
      await outboxRepository.save(failingPublicationEvent);

      // assert
      const storedEventRowsAfterFailure = await getAllEventsStored();
      expect(storedEventRowsAfterFailure).toHaveLength(1);
      expectStoredRowsToMatchEvent(
        storedEventRowsAfterFailure,
        failingPublicationEvent,
      );

      const successPublicationEvent: DomainEvent = {
        ...event,
        publications: [
          ...failingPublicationEvent.publications,
          {
            publishedAt: new Date("2022-01-02").toISOString(),
            failures: [],
          },
        ],
        status: "published",
      };

      // act (when event already exist, and the publication is now successful)
      await outboxRepository.save(successPublicationEvent);

      // assert
      const storedEventRowsAfterSuccess = await getAllEventsStored();
      expect(storedEventRowsAfterSuccess).toHaveLength(2);
      expectStoredRowsToMatchEvent(
        storedEventRowsAfterSuccess,
        successPublicationEvent,
      );
    });

    it("sets was_quarantined for quarantined event types", async () => {
      // prepare
      uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
      const convention = new ConventionDtoBuilder().build();
      const event = createNewEvent({
        topic: quarantinedTopic,
        payload: { convention, triggeredBy: null },
        status: "published",
      });

      // act
      await outboxRepository.save(event);

      // assert
      const storedEventRows = await getAllEventsStored();
      expect(storedEventRows).toHaveLength(1);
      expectStoredRowsToMatchEvent(storedEventRows, {
        ...event,
        wasQuarantined: true,
        status: "published",
      });
    });

    it("sets to quarantined event if the event is already in db with publications", async () => {
      const convention = new ConventionDtoBuilder().build();
      uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
      timeGateway.setNextDate(new Date("2021-11-15T10:01:00.000Z"));
      const eventFailedToRerun = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
        status: "failed-but-will-retry",
        publications: [
          {
            publishedAt: "2021-11-15T08:00:00.000Z",
            failures: [
              {
                subscriptionId: "subscription1",
                errorMessage: "some error message",
              },
              {
                subscriptionId: "subscription2",
                errorMessage: "some other error",
              },
            ],
          },
        ],
      });
      const quarantinedConvention = {
        ...eventFailedToRerun,
        wasQuarantined: true,
      };
      await storeInOutbox([eventFailedToRerun]);

      await outboxRepository.save(quarantinedConvention);
      const storedEventRows = await getAllEventsStored();
      expect(storedEventRows).toHaveLength(2);
      expectStoredRowsToMatchEvent(storedEventRows, quarantinedConvention);
    });
  });

  describe("markEventsAsInProcess", () => {
    it("works even if there is no events to mark", async () => {
      await outboxRepository.markEventsAsInProcess([]);
      const storedEventRows = await getAllEventsStored();
      expect(storedEventRows).toEqual([]);
    });

    it("marks events as in-process", async () => {
      const convention = new ConventionDtoBuilder().build();
      uuidGenerator.setNextUuids([
        "aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa",
        "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb",
        "cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc",
      ]);
      const event1 = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
      });
      const event2 = createNewEvent({
        topic: "ApiConsumerSaved",
        payload: {
          consumerId: "consumerId",
          triggeredBy: { kind: "connected-user", userId: "Bob" },
        },
      });
      const event3 = createNewEvent({
        topic: "ApiConsumerSaved",
        payload: {
          consumerId: "other-consumer-id",
          triggeredBy: { kind: "connected-user", userId: "Jane" },
        },
      });

      await storeInOutbox([event1, event2, event3]);

      // act
      await outboxRepository.markEventsAsInProcess([event1, event3]);

      // assert
      const storedEventRows = await getAllEventsStored();
      expectArraysToEqualIgnoringOrder(
        storedEventRows.map(({ status, id }) => ({
          id,
          status,
        })),
        [
          { id: event1.id, status: "in-process" },
          { id: event2.id, status: "never-published" },
          { id: event3.id, status: "in-process" },
        ],
      );
    });
  });

  describe("markOldInProcessEventsAsToRepublish", () => {
    const oneHourAgo = subHours(timeGateway.now(), 1);

    it("works even if there is no events to mark", async () => {
      await outboxRepository.markOldInProcessEventsAsToRepublish({
        eventsBeforeDate: oneHourAgo,
      });
      const storedEventRows = await getAllEventsStored();
      expect(storedEventRows).toEqual([]);
    });

    it("do not update quanrantined events", async () => {
      const convention = new ConventionDtoBuilder().build();
      uuidGenerator.setNextUuids([
        "aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa",
        "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb",
        "cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc",
      ]);
      const eventQuarantined = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        status: "in-process",
        wasQuarantined: true,
        occurredAt: subHours(timeGateway.now(), 2).toISOString(),
        payload: { convention, triggeredBy: null },
      });
      const event = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        status: "in-process",
        occurredAt: subHours(timeGateway.now(), 2).toISOString(),
        payload: { convention, triggeredBy: null },
      });
      await storeInOutbox([eventQuarantined, event]);

      await outboxRepository.markOldInProcessEventsAsToRepublish({
        eventsBeforeDate: oneHourAgo,
      });
      const storedEventRows = await getAllEventsStored();
      expectArraysToEqualIgnoringOrder(
        storedEventRows.map(({ status, id }) => ({
          id,
          status,
        })),
        [
          { id: eventQuarantined.id, status: "in-process" },
          { id: event.id, status: "to-republish" },
        ],
      );
    });

    it("marks in-process events older than an hour as to republish", async () => {
      const convention = new ConventionDtoBuilder().build();
      uuidGenerator.setNextUuids([
        "aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa",
        "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb",
        "cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc",
      ]);
      const oldEvent = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        status: "in-process",
        occurredAt: subHours(timeGateway.now(), 2).toISOString(),
        payload: { convention, triggeredBy: null },
      });
      const newEvent = createNewEvent({
        topic: "ApiConsumerSaved",
        status: "in-process",
        payload: {
          consumerId: "consumerId",
          triggeredBy: { kind: "connected-user", userId: "Bob" },
        },
      });
      await storeInOutbox([oldEvent, newEvent]);

      await outboxRepository.markOldInProcessEventsAsToRepublish({
        eventsBeforeDate: oneHourAgo,
      });

      const storedEventRows = await getAllEventsStored();
      expectArraysToEqualIgnoringOrder(
        storedEventRows.map(({ status, id }) => ({
          id,
          status,
        })),
        [
          { id: oldEvent.id, status: "to-republish" },
          { id: newEvent.id, status: "in-process" },
        ],
      );
    });
  });

  const storeInOutbox = async (events: DomainEvent[]) => {
    await Promise.all(events.map((event) => outboxRepository.save(event)));
  };

  const getAllEventsStored = (): Promise<StoredEventRow[]> =>
    // TODO: kysely query builder hard to make here
    db
      .executeQuery<StoredEventRow>(
        CompiledQuery.raw(`
        SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload, status, published_at, subscription_id, error_message, priority
        FROM outbox
        LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
        LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
      `),
      )
      .then((result) => result.rows);
});

const expectStoredRowsToMatchEvent = (
  rows: StoredEventRow[],
  event: DomainEvent,
) => {
  const { occurredAt, wasQuarantined, publications, ...rest } = event;

  const commonStoredEventFields = {
    ...rest,
    occurred_at: new Date(occurredAt),
    was_quarantined: wasQuarantined,
  };

  if (!publications.length) {
    expect(rows).toEqual([
      {
        ...commonStoredEventFields,
        published_at: null,
        subscription_id: null,
        error_message: null,
        priority: commonStoredEventFields.priority ?? null,
      },
    ]);
    return;
  }

  const expectedRowsForEvent: StoredEventRow[] = publications.flatMap(
    ({ publishedAt, failures }) =>
      !failures.length
        ? [
            {
              ...commonStoredEventFields,
              published_at: new Date(publishedAt),
              subscription_id: null,
              error_message: null,
              priority: commonStoredEventFields.priority ?? null,
            },
          ]
        : failures.map(
            (failure): StoredEventRow => ({
              ...commonStoredEventFields,
              published_at: new Date(publishedAt),
              subscription_id: failure.subscriptionId,
              error_message: failure.errorMessage,
              priority: commonStoredEventFields.priority ?? null,
            }),
          ),
  );
  expectArraysToEqualIgnoringOrder(rows, expectedRowsForEvent);
};

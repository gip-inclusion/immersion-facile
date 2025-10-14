import type { Pool } from "pg";
import {
  type ConventionDto,
  ConventionDtoBuilder,
  expectToEqual,
} from "shared";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { DomainEvent, DomainTopic } from "../events";
import { type CreateNewEvent, makeCreateNewEvent } from "../ports/EventBus";
import { PgOutboxQueries } from "./PgOutboxQueries";
import { PgOutboxRepository } from "./PgOutboxRepository";

describe("PgOutboxQueries for crawling purposes", () => {
  let neverPublished1: DomainEvent;
  let neverPublished2: DomainEvent;
  let neverPublished3: DomainEvent;
  let eventFailedToRerun: DomainEvent;
  let withFailureButEventuallySuccessfulEvent: DomainEvent;
  let alreadyProcessedEvent: DomainEvent;
  let quarantinedEvent: DomainEvent;
  let convention: ConventionDto;
  let failedButQuarantinedEvent: DomainEvent;
  let inProcessEvent: DomainEvent;
  let failedButSucceededBefore: DomainEvent;
  let prioritizedEvent: DomainEvent;

  const createEvents = async (
    uuidGenerator: TestUuidGenerator,
    timeGateway: CustomTimeGateway,
    createNewEvent: CreateNewEvent,
  ) => {
    const quarantinedTopic: DomainTopic = "ConventionRejected";

    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
    timeGateway.setNextDate(new Date("2021-11-15T10:00:00.000Z"));
    convention = new ConventionDtoBuilder().build();
    neverPublished1 = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      status: "never-published",
      payload: { convention, triggeredBy: null },
    });

    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaab");
    timeGateway.setNextDate(new Date("2021-11-15T10:00:30.000Z"));
    prioritizedEvent = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      status: "never-published",
      payload: { convention, triggeredBy: null },
      priority: 1,
    });

    uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
    timeGateway.setNextDate(new Date("2021-11-15T10:01:00.000Z"));
    neverPublished2 = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      status: "never-published",
      payload: { convention, triggeredBy: null },
    });

    uuidGenerator.setNextUuid("cbcbcc99-9c0b-bbbb-bb6d-6bb9bd38cccc");
    timeGateway.setNextDate(new Date("2021-11-15T10:02:00.000Z"));
    neverPublished3 = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      status: "never-published",
      payload: { convention, triggeredBy: null },
    });

    timeGateway.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
    uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
    alreadyProcessedEvent = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      status: "published",
      payload: { convention, triggeredBy: null },
      publications: [{ publishedAt: "2021-11-15T08:30:00.000Z", failures: [] }],
    });

    timeGateway.setNextDate(new Date("2021-11-15T10:03:00.000Z"));
    uuidGenerator.setNextUuid("dddddd99-9d0d-dddd-dd6d-6dd9dd38dddd");
    quarantinedEvent = createNewEvent({
      topic: quarantinedTopic,
      status: "failed-but-will-retry",
      payload: { convention, triggeredBy: null },
    });

    uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
    timeGateway.setNextDate(new Date("2021-11-15T10:01:00.000Z"));
    eventFailedToRerun = createNewEvent({
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

    timeGateway.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
    uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
    withFailureButEventuallySuccessfulEvent = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      payload: { convention, triggeredBy: null },
      status: "published",
      publications: [
        {
          publishedAt: "2021-11-15T06:00:00.000Z",
          failures: [
            { subscriptionId: "subscriptionB", errorMessage: "Some failure" },
          ],
        },
        { publishedAt: "2021-11-15T07:00:00.000Z", failures: [] },
      ],
    });

    timeGateway.setNextDate(new Date("2021-11-15T10:03:00.000Z"));
    uuidGenerator.setNextUuid("dddddd99-9d0d-dddd-dd6d-6dd9dd38dddd");
    failedButQuarantinedEvent = createNewEvent({
      topic: quarantinedTopic,
      payload: { convention, triggeredBy: null },
      status: "failed-but-will-retry",
      publications: [
        {
          publishedAt: "2021-11-15T09:00:00.000Z",
          failures: [
            {
              subscriptionId: "subscription1",
              errorMessage: "some error message",
            },
          ],
        },
      ],
    });

    timeGateway.setNextDate(new Date("2021-11-15T10:04:00.000Z"));
    uuidGenerator.setNextUuid("dbdbdc99-9d0d-dddd-dd6d-6dd9dd38dbdb");
    inProcessEvent = createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      payload: { convention, triggeredBy: null },
      status: "in-process",
    });

    timeGateway.setNextDate(new Date("2021-11-15T07:30:00.000Z"));
    uuidGenerator.setNextUuid("eeeeee99-9d0d-eeee-ee6d-6ee9ee38eeee");
    failedButSucceededBefore = createNewEvent({
      status: "failed-but-will-retry",
      wasQuarantined: false,
      topic: "ConventionSubmittedByBeneficiary",
      payload: { convention, triggeredBy: null },
      publications: [
        {
          publishedAt: "2021-11-15T08:00:00.000Z",
          failures: [],
        },
        {
          publishedAt: "2021-11-15T09:00:00.000Z",
          failures: [
            {
              subscriptionId: "subscriptionAAA",
              errorMessage: "some error message",
            },
          ],
        },
      ],
    });
  };

  let pool: Pool;
  let outboxQueries: PgOutboxQueries;
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
    const db = makeKyselyDb(pool);

    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();

    outboxQueries = new PgOutboxQueries(db);

    await createEvents(uuidGenerator, timeGateway, createNewEvent);
  });

  describe("getEventsToPublish", () => {
    it("finds all events to be processed", async () => {
      timeGateway.setNextDate(new Date("2020-11-15T09:00:00.000Z"));
      uuidGenerator.setNextUuid("cccccc77-9c0c-cccc-cc6d-6cc9cd38cccc");
      const eventToRepublish = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
        publications: [
          { publishedAt: "2020-11-05T08:30:00.000Z", failures: [] },
        ],
        status: "to-republish",
      });

      await storeInOutbox([
        neverPublished2,
        neverPublished1,
        neverPublished3,
        alreadyProcessedEvent,
        quarantinedEvent,
        inProcessEvent,
        eventToRepublish,
        prioritizedEvent,
      ]);

      // act
      const events = await outboxQueries.getEventsToPublish({ limit: 3 });

      // assert
      expectToEqual(events, [
        prioritizedEvent,
        eventToRepublish,
        neverPublished1,
      ]);
    });
  });

  describe("getFailedEvents", () => {
    it("finds all events that have failed and should be reprocessed", async () => {
      await storeInOutbox([
        eventFailedToRerun,
        neverPublished1,
        withFailureButEventuallySuccessfulEvent,
        failedButQuarantinedEvent,
        inProcessEvent,
      ]);

      // act
      const eventsToRerun = await outboxQueries.getFailedEvents({ limit: 10 });

      // assert
      expectToEqual(eventsToRerun, [eventFailedToRerun]);
    });

    it("finds all events that have failed and should be reprocessed, even if some publication was OK before", async () => {
      await storeInOutbox([
        neverPublished1,
        withFailureButEventuallySuccessfulEvent,
        failedButQuarantinedEvent,
        inProcessEvent,
        failedButSucceededBefore,
      ]);

      // act
      const eventsToRerun = await outboxQueries.getFailedEvents({ limit: 10 });

      // assert
      expectToEqual(eventsToRerun, [failedButSucceededBefore]);
      expectToEqual(
        eventsToRerun[0].publications.map((pub) => pub.publishedAt),
        ["2021-11-15T08:00:00.000Z", "2021-11-15T09:00:00.000Z"], // order is important
      );
    });

    it("finds all events that have failed and should be reprocessed with limit", async () => {
      // prepare
      uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38cccc");
      timeGateway.setNextDate(new Date("2021-11-15T10:02:00.000Z"));
      const anotherEventFailedToRerun = createNewEvent({
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention, triggeredBy: null },
        publications: [
          {
            publishedAt: "2021-11-10T08:00:00.000Z",
            failures: [
              {
                subscriptionId: "subscription3",
                errorMessage: "some error message 3",
              },
            ],
          },
        ],
      });

      await storeInOutbox([
        eventFailedToRerun,
        neverPublished1,
        withFailureButEventuallySuccessfulEvent,
        failedButQuarantinedEvent,
        anotherEventFailedToRerun,
        inProcessEvent,
      ]);

      // act
      const eventsToRerun = await outboxQueries.getFailedEvents({ limit: 1 });

      // assert
      expectToEqual(eventsToRerun, [eventFailedToRerun]);
    });
  });

  const storeInOutbox = async (events: DomainEvent[]) => {
    await Promise.all(
      events.map((event) =>
        new PgOutboxRepository(makeKyselyDb(pool)).save(event),
      ),
    );
  };
});

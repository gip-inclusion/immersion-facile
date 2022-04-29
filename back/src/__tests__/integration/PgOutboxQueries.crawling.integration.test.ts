import { Pool, PoolClient } from "pg";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { PgOutboxQueries } from "../../adapters/secondary/pg/PgOutboxQueries";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../domain/core/eventBus/events";
import { expectArraysToEqualIgnoringOrder } from "../../_testBuilders/test.helpers";
import { PgOutboxRepository } from "../../adapters/secondary/pg/PgOutboxRepository";

describe("PgOutboxQueries for crawling purposes", () => {
  let pool: Pool;
  let client: PoolClient;
  let outboxQueries: PgOutboxQueries;
  const uuidGenerator = new TestUuidGenerator();
  const clock = new CustomClock();
  const quarantinedTopic: DomainTopic = "ImmersionApplicationRejected";

  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    clock,
    quarantinedTopics: [quarantinedTopic],
  });

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM outbox_failures");
    await client.query("DELETE FROM outbox_publications");
    await client.query("DELETE FROM outbox");

    outboxQueries = new PgOutboxQueries(client);
  });

  it("finds all events to be processed", async () => {
    // prepare
    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
    clock.setNextDate(new Date("2021-11-15T10:00:00.000Z"));
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    const event1 = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
    });

    uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
    clock.setNextDate(new Date("2021-11-15T10:01:00.000Z"));
    const event2 = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
    });

    clock.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
    uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
    const alreadyProcessedEvent = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
      publications: [{ publishedAt: "2021-11-15T08:30:00.000Z", failures: [] }],
    });

    clock.setNextDate(new Date("2021-11-15T10:03:00.000Z"));
    uuidGenerator.setNextUuid("dddddd99-9d0d-dddd-dd6d-6dd9dd38dddd");
    const quarantinedEvent = createNewEvent({
      topic: quarantinedTopic,
      payload: immersionApplication,
    });

    await storeInOutbox([
      event2,
      event1,
      alreadyProcessedEvent,
      quarantinedEvent,
    ]);

    // act
    const events = await outboxQueries.getAllUnpublishedEvents();

    // assert
    expectArraysToEqualIgnoringOrder(events, [event1, event2]);
  });

  it("finds all events that have failed and should be reprocessed", async () => {
    // prepare
    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
    clock.setNextDate(new Date("2021-11-15T10:00:00.000Z"));
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    const event1 = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
    });

    uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
    clock.setNextDate(new Date("2021-11-15T10:01:00.000Z"));
    const eventFailedToRerun = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
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

    clock.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
    uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
    const withFailureButEventuallySuccessfulEvent = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
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

    clock.setNextDate(new Date("2021-11-15T10:03:00.000Z"));
    uuidGenerator.setNextUuid("dddddd99-9d0d-dddd-dd6d-6dd9dd38dddd");
    const failedButQuarantinedEvent = createNewEvent({
      topic: quarantinedTopic,
      payload: immersionApplication,
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

    await storeInOutbox([
      eventFailedToRerun,
      event1,
      withFailureButEventuallySuccessfulEvent,
      failedButQuarantinedEvent,
    ]);

    // act
    const eventsToRerun = await outboxQueries.getAllFailedEvents();

    // assert
    expect(eventsToRerun).toHaveLength(1);
    expect(eventsToRerun[0]).toEqual(eventFailedToRerun);
  });

  const storeInOutbox = async (events: DomainEvent[]) => {
    await Promise.all(
      events.map((event) => new PgOutboxRepository(client).save(event)),
    );
  };
});

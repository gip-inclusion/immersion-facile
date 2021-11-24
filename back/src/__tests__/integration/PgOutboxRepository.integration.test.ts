import { Pool, PoolClient } from "pg";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { PgOutboxRepository } from "../../adapters/secondary/pg/PgOutboxRepository";
import { DomainEvent } from "../../domain/core/eventBus/events";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { makeCreateNewEvent } from "./../../domain/core/eventBus/EventBus";
import { DomainTopic } from "./../../domain/core/eventBus/events";

describe("PgOutboxRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let outboxRepository: PgOutboxRepository;
  const uuidGenerator = new TestUuidGenerator();
  const clock = new CustomClock();
  const quarantinedTopic: DomainTopic = "ImmersionApplicationRejected";

  let createNewEvent = makeCreateNewEvent({
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
    await client.query("TRUNCATE outbox");
    outboxRepository = new PgOutboxRepository(client);
  });

  it("saves an event to be processed", async () => {
    // prepare
    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    const event = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
    });

    // act
    await outboxRepository.save(event);

    // assert
    const eventsStored = await getAllEventsStored();
    expect(eventsStored).toHaveLength(1);
    const { occurredAt, wasPublished, wasQuarantined, ...rest } = event;
    expect(eventsStored[0]).toEqual({
      ...rest,
      occurred_at: new Date(occurredAt),
      was_published: wasPublished,
      was_quarantined: wasQuarantined,
    });
  });

  it("sets was_quarantined for quarantined event types", async () => {
    // prepare
    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    const event = createNewEvent({
      topic: quarantinedTopic,
      payload: immersionApplication,
    });

    // act
    await outboxRepository.save(event);

    // assert
    const eventsStored = await getAllEventsStored();
    expect(eventsStored).toHaveLength(1);
    const { occurredAt, wasPublished, wasQuarantined, ...rest } = event;
    expect(eventsStored[0]).toEqual({
      ...rest,
      occurred_at: new Date(occurredAt),
      was_published: wasPublished,
      was_quarantined: true,
    });
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
      wasPublished: true,
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
    const events = await outboxRepository.getAllUnpublishedEvents();

    // assert
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(event1);
    expect(events[1]).toEqual(event2);
  });

  it("marks given events as published", async () => {
    // prepare
    uuidGenerator.setNextUuid("aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa");
    const immersionApplication = new ImmersionApplicationDtoBuilder()
      .withId("event1")
      .build();
    const event1 = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
    });

    uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
    const event2 = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: new ImmersionApplicationDtoBuilder().withId("event2").build(),
    });

    await storeInOutbox([event1, event2]);

    // act
    await outboxRepository.markEventsAsPublished([event1, event2]);

    // assert
    const publishedEvents = await getAllEventsStored();
    expect(publishedEvents).toHaveLength(2);
    publishedEvents.every((event) => expect(event.was_published).toBeTruthy());
  });

  const storeInOutbox = async (events: DomainEvent[]) => {
    await Promise.all(events.map((event) => outboxRepository.save(event)));
  };

  const getAllEventsStored = () =>
    client.query("SELECT * FROM outbox").then((result) => result.rows);
});

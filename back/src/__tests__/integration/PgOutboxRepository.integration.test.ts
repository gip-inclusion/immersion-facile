import { Pool, PoolClient } from "pg";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  PgOutboxRepository,
  StoredEventRow,
} from "../../adapters/secondary/pg/PgOutboxRepository";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../domain/core/eventBus/events";
import { expectArraysToEqualIgnoringOrder } from "../../_testBuilders/test.helpers";

describe("PgOutboxRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let outboxRepository: PgOutboxRepository;
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

    outboxRepository = new PgOutboxRepository(client);
  });

  it("saves an event with published data", async () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    clock.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
    uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
    const alreadyProcessedEvent = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
      publications: [{ publishedAt: "2021-11-15T08:30:00.000Z", failures: [] }],
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
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    const event = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplication,
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
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
    const event = createNewEvent({
      topic: quarantinedTopic,
      payload: immersionApplication,
    });

    // act
    await outboxRepository.save(event);

    // assert
    const storedEventRows = await getAllEventsStored();
    expect(storedEventRows).toHaveLength(1);
    expectStoredRowsToMatchEvent(storedEventRows, {
      ...event,
      wasQuarantined: true,
    });
  });

  it("sets to quarantined event if the event is already in db with publications", async () => {
    const immersionApplication = new ImmersionApplicationDtoBuilder().build();
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
    const quarantinedImmersionApplication = {
      ...eventFailedToRerun,
      wasQuarantined: true,
    };
    await storeInOutbox([eventFailedToRerun]);

    await outboxRepository.save(quarantinedImmersionApplication);
    const storedEventRows = await getAllEventsStored();
    expect(storedEventRows).toHaveLength(2);
    expectStoredRowsToMatchEvent(
      storedEventRows,
      quarantinedImmersionApplication,
    );
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
    const events = await outboxRepository.getAllUnpublishedEvents();

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
    const eventsToRerun = await outboxRepository.getAllFailedEvents();

    // assert
    expect(eventsToRerun).toHaveLength(1);
    expect(eventsToRerun[0]).toEqual(eventFailedToRerun);
  });

  describe("Pg implementation of method getLastDateOfFormEstablishmentEditLinkSentWithSiret", () => {
    const siret = "12345678901234";
    it("Returns undefined if there is no previous event FormEstablishmentEditLinkSent with given siret in payload", async () => {
      // Act
      const actualLastDate =
        await outboxRepository.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
          siret,
        );
      // Assert
      expect(actualLastDate).toBeUndefined();
    });
    it("Returns the last previous event FormEstablishmentEditLinkSent with given siret in payload", async () => {
      // Prepare
      clock.setNextDate(new Date("2020-01-01"));
      uuidGenerator.setNextUuid("dddddd99-9d0d-dddd-dd6d-6dd9dd38dddd");
      const eventWithSiret_01jan20 = createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret,
          iat: new Date("2020-01-01").getTime(),
          exp: new Date("2020-01-02").getTime(),
          version: 1,
        },
      });

      clock.setNextDate(new Date("2020-01-05"));
      uuidGenerator.setNextUuid("eeeeee99-9d0d-dddd-dd6d-6dd9dd38dddd");

      const eventWithSiret_05jan20 = createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret,
          iat: new Date("2020-01-05").getTime(),
          exp: new Date("2020-01-06").getTime(),
          version: 1,
        },
      });

      uuidGenerator.setNextUuid("ffffff99-9d0d-dddd-dd6d-6dd9dd38dddd");
      const eventWithOtherSiret_05jan20 = createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload: {
          siret: "11111111111111",
          iat: new Date("2020-01-05").getTime(),
          exp: new Date("2020-01-06").getTime(),
          version: 1,
        },
      });
      await storeInOutbox([
        eventWithSiret_01jan20,
        eventWithSiret_05jan20,
        eventWithOtherSiret_05jan20,
      ]);

      // Act
      const actualLastPayload =
        await outboxRepository.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
          siret,
        );
      // Assert
      expect(actualLastPayload).toEqual(eventWithSiret_05jan20.payload);
    });
  });

  const storeInOutbox = async (events: DomainEvent[]) => {
    await Promise.all(events.map((event) => outboxRepository.save(event)));
  };

  const getAllEventsStored = (): Promise<StoredEventRow[]> =>
    client
      .query(
        `
        SELECT outbox.id as id, occurred_at, was_quarantined, topic, payload,
          published_at, subscription_id, error_message 
        FROM outbox  
        LEFT JOIN outbox_publications ON outbox.id = outbox_publications.event_id
        LEFT JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
      `,
      )
      .then((result) => result.rows);

  //         JOIN outbox_failures ON outbox_failures.publication_id = outbox_publications.id
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
      },
    ]);
    return;
  }

  const expectedRowsForEvent: StoredEventRow[] = publications.flatMap(
    ({ publishedAt, failures }): StoredEventRow[] => {
      if (!failures.length)
        return [
          {
            ...commonStoredEventFields,
            published_at: new Date(publishedAt),
            subscription_id: null,
            error_message: null,
          },
        ];

      return failures.map(
        (failure): StoredEventRow => ({
          ...commonStoredEventFields,
          published_at: new Date(publishedAt),
          subscription_id: failure.subscriptionId,
          error_message: failure.errorMessage,
        }),
      );
    },
  );

  expectArraysToEqualIgnoringOrder(rows, expectedRowsForEvent);
};

import { Pool, PoolClient } from "pg";

import { ConventionDtoBuilder, expectArraysToEqualIgnoringOrder } from "shared";

import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../../domain/core/eventBus/events";
import { CustomTimeGateway } from "../core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../core/UuidGeneratorImplementations";

import { PgOutboxRepository, StoredEventRow } from "./PgOutboxRepository";

describe("PgOutboxRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let outboxRepository: PgOutboxRepository;
  const uuidGenerator = new TestUuidGenerator();
  const timeGateway = new CustomTimeGateway();
  const quarantinedTopic: DomainTopic = "ImmersionApplicationRejected";

  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    timeGateway,
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
    const convention = new ConventionDtoBuilder().build();
    timeGateway.setNextDate(new Date("2021-11-15T09:00:00.000Z"));
    uuidGenerator.setNextUuid("cccccc99-9c0c-cccc-cc6d-6cc9cd38cccc");
    const alreadyProcessedEvent = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: convention,
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
    const convention = new ConventionDtoBuilder().build();
    const event = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: convention,
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
    const convention = new ConventionDtoBuilder().build();
    const event = createNewEvent({
      topic: quarantinedTopic,
      payload: convention,
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
    const convention = new ConventionDtoBuilder().build();
    uuidGenerator.setNextUuid("bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb");
    timeGateway.setNextDate(new Date("2021-11-15T10:01:00.000Z"));
    const eventFailedToRerun = createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: convention,
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

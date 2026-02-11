import { subDays } from "date-fns";
import {
  type ConventionDraftDto,
  type ConventionDraftId,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type GetOldConventionDraftsAndEmitDeleteEvent,
  makeGetOldConventionDraftsAndEmitDeleteEvent,
} from "./GetOldConventionDraftsAndEmitDeleteEvent";

describe("GetOldConventionDraftsAndEmitDeleteEvent", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let uuidGenerator: TestUuidGenerator;
  let getOldConventionDraftsAndEmitDeleteEvent: GetOldConventionDraftsAndEmitDeleteEvent;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    getOldConventionDraftsAndEmitDeleteEvent =
      makeGetOldConventionDraftsAndEmitDeleteEvent({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          timeGateway,
          createNewEvent,
        },
      });

    uow.conventionDraftRepository.conventionDrafts = [];
    uow.outboxRepository.events = [];
  });

  it("should return old convention drafts and emit events", async () => {
    const now = timeGateway.now();
    const thirtyDaysAgo = subDays(now, 30);

    const oldConventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind: "immersion",
    };

    const expectedEventId = `event-id-${oldConventionDraft.id}`;
    uuidGenerator.setNextUuids([expectedEventId]);

    await uow.conventionDraftRepository.save(
      oldConventionDraft,
      new Date(thirtyDaysAgo).toISOString(),
    );

    const { numberOfOldConventionDraftIds } =
      await getOldConventionDraftsAndEmitDeleteEvent.execute();

    expectToEqual(numberOfOldConventionDraftIds, 1);
    expectToEqual(uow.outboxRepository.events, [
      {
        topic: "ConventionDrafToDelete",
        payload: {
          conventionDraftId: oldConventionDraft.id,
          triggeredBy: {
            kind: "crawler",
          },
        },
        id: expectedEventId,
        occurredAt: expect.any(String),
        publications: [],
        wasQuarantined: false,
        status: "never-published",
      },
    ]);
  });

  it("should not emit events if no old convention drafts found", async () => {
    const now = timeGateway.now();
    const recentConventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind: "immersion",
    };

    await uow.conventionDraftRepository.save(
      recentConventionDraft,
      new Date(now).toISOString(),
    );

    const { numberOfOldConventionDraftIds } =
      await getOldConventionDraftsAndEmitDeleteEvent.execute();

    expectToEqual(numberOfOldConventionDraftIds, 0);
    expectToEqual(uow.outboxRepository.events, []);
  });

  it("should only return and emit events of old convention drafts", async () => {
    const now = timeGateway.now();
    const thirtyDaysAgo = subDays(now, 30);
    const thirtyDaysAgoPlus1Millisecond = new Date(
      subDays(now, 30).getTime() + 1,
    );

    const oldConventionDraft: ConventionDraftDto = {
      id: uuid(),
      internshipKind: "immersion",
    };

    const conventionDraftLimitTimeStampCase: ConventionDraftDto = {
      id: uuid(),
      internshipKind: "immersion",
    };

    const expectedOldConventionDraftIds: ConventionDraftId[] = [
      oldConventionDraft.id,
    ];
    const expectedEventIds = expectedOldConventionDraftIds.map(
      (expectedOldConventionDraftId) =>
        `event-id-${expectedOldConventionDraftId}`,
    );
    uuidGenerator.setNextUuids(expectedEventIds);

    await uow.conventionDraftRepository.save(
      oldConventionDraft,
      new Date(thirtyDaysAgo).toISOString(),
    );
    await uow.conventionDraftRepository.save(
      conventionDraftLimitTimeStampCase,
      new Date(thirtyDaysAgoPlus1Millisecond).toISOString(),
    );

    const { numberOfOldConventionDraftIds } =
      await getOldConventionDraftsAndEmitDeleteEvent.execute();

    expectToEqual(
      numberOfOldConventionDraftIds,
      expectedOldConventionDraftIds.length,
    );
    expectToEqual(
      uow.outboxRepository.events,
      expectedOldConventionDraftIds.map((oldConventionDraftId, index) => ({
        topic: "ConventionDrafToDelete" as const,
        payload: {
          conventionDraftId: oldConventionDraftId,
          triggeredBy: {
            kind: "crawler" as const,
          },
        },
        id: expectedEventIds[index],
        occurredAt: expect.any(String),
        publications: [],
        wasQuarantined: false,
        status: "never-published" as const,
      })),
    );
  });
});

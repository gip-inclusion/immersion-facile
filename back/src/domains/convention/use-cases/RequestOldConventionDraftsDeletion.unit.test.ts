import { subDays } from "date-fns";
import {
  type ConventionDraftDto,
  type ConventionDraftId,
  expectObjectInArrayToMatch,
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
  makeRequestOldConventionDraftsDeletion,
  type RequestOldConventionDraftsDeletion,
} from "./RequestOldConventionDraftsDeletion";

describe("RequestOldConventionDraftsDeletion", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;
  let uuidGenerator: TestUuidGenerator;
  let RequestOldConventionDraftsDeletion: RequestOldConventionDraftsDeletion;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    RequestOldConventionDraftsDeletion = makeRequestOldConventionDraftsDeletion(
      {
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          timeGateway,
          createNewEvent,
        },
      },
    );

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
      await RequestOldConventionDraftsDeletion.execute();

    expectToEqual(numberOfOldConventionDraftIds, 1);
    expectObjectInArrayToMatch(uow.outboxRepository.events, [
      {
        topic: "ConventionDrafToDelete" as const,
        payload: {
          conventionDraftId: oldConventionDraft.id,
          triggeredBy: {
            kind: "crawler" as const,
          },
        },
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
      await RequestOldConventionDraftsDeletion.execute();

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
      await RequestOldConventionDraftsDeletion.execute();

    expectToEqual(
      numberOfOldConventionDraftIds,
      expectedOldConventionDraftIds.length,
    );

    expectObjectInArrayToMatch(
      uow.outboxRepository.events,
      expectedOldConventionDraftIds.map((oldConventionDraftId) => ({
        topic: "ConventionDrafToDelete" as const,
        payload: {
          conventionDraftId: oldConventionDraftId,
          triggeredBy: {
            kind: "crawler" as const,
          },
        },
      })),
    );
  });
});

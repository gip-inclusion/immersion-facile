import { subDays, subYears } from "date-fns";
import { expectToEqual, makeBooleanFeatureFlag } from "shared";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeUser,
  saveDeletionWarningNotification,
  setUsersWithRecentConventions,
  setUsersWithRecentEstablishmentExchanges,
  setUserWithOldConventionAndDiscussion,
} from "./inactiveUsersTest.helpers";
import {
  makeTriggerEventsToDeleteInactiveUsers,
  type TriggerEventsToDeleteInactiveUsers,
} from "./TriggerEventsToDeleteInactiveUsers";

const now = new Date("2026-01-15T10:00:00.000Z");

describe("TriggerEventsToDeleteInactiveUsers", () => {
  let uow: InMemoryUnitOfWork;
  let triggerEventsToDeleteInactiveUsers: TriggerEventsToDeleteInactiveUsers;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.featureFlagRepository.featureFlags = {
      enableInactiveUsersCleanup: makeBooleanFeatureFlag(true),
    };
    timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(now);

    const uuidGenerator = new UuidV4Generator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    triggerEventsToDeleteInactiveUsers = makeTriggerEventsToDeleteInactiveUsers(
      {
        deps: {
          uowPerformer: new InMemoryUowPerformer(uow),
          timeGateway,
          createNewEvent,
          batchSize: 2,
        },
      },
    );
  });

  it("does nothing when the enableInactiveUsersCleanup flag is off", async () => {
    uow.featureFlagRepository.featureFlags = {
      enableInactiveUsersCleanup: makeBooleanFeatureFlag(false),
    };
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      lastLoginAt: subDays(subYears(now, 2), 1).toISOString(),
    });
    uow.userRepository.users = [inactiveUser];

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("saves a quarantined InactiveUserAccountDeletionTriggered event by default", async () => {
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      lastLoginAt: subDays(subYears(now, 2), 1).toISOString(),
    });
    uow.userRepository.users = [inactiveUser];
    saveDeletionWarningNotification({
      uow,
      userId: inactiveUser.id,
      createdAt: subDays(now, 8),
    });

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 1 });
    expectToEqual(uow.outboxRepository.events.length, 1);
    const event = uow.outboxRepository.events[0];
    expectToEqual(event.topic, "InactiveUserAccountDeletionTriggered");
    expectToEqual(event.payload, {
      userId: inactiveUser.id,
      triggeredBy: { kind: "crawler" },
    });
    expectToEqual(event.wasQuarantined, true);
    expectToEqual(event.priority, 8);
  });

  it("saves non-quarantined events when enableInactiveUsersDeletionAutoProcessing is on", async () => {
    uow.featureFlagRepository.featureFlags = {
      enableInactiveUsersCleanup: makeBooleanFeatureFlag(true),
      enableInactiveUsersDeletionAutoProcessing: makeBooleanFeatureFlag(true),
    };
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      lastLoginAt: subDays(subYears(now, 2), 1).toISOString(),
    });
    uow.userRepository.users = [inactiveUser];
    saveDeletionWarningNotification({
      uow,
      userId: inactiveUser.id,
      createdAt: subDays(now, 8),
    });

    await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(uow.outboxRepository.events.length, 1);
    expectToEqual(uow.outboxRepository.events[0].wasQuarantined, false);
    expectToEqual(uow.outboxRepository.events[0].priority, 8);
  });

  it("returns 0 and saves no events when no users to delete", async () => {
    uow.userRepository.users = [];

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("does not trigger deletion for user with convention ending within 2-year window (future or 23 months ago)", async () => {
    setUsersWithRecentConventions({
      now,
      uow,
      users: [
        {
          id: "future-convention-id",
          email: "future-convention@test.fr",
        },
        {
          id: "recent-convention-id",
          email: "recent-convention@test.fr",
        },
      ],
    });

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("does not trigger deletion for user who sent a recent exchange as establishment (30 days ago or 23 months ago)", async () => {
    setUsersWithRecentEstablishmentExchanges({
      now,
      uow,
      users: [
        {
          id: "recent-exchange-id",
          email: "recent-exchange@test.fr",
        },
        {
          id: "old-exchange-id",
          email: "old-exchange@test.fr",
        },
      ],
    });

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("triggers deletion for user with expired convention and old discussion", async () => {
    const twoYearsAgo = subYears(now, 2);
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    setUserWithOldConventionAndDiscussion({
      now,
      uow,
      user: inactiveUser,
    });
    saveDeletionWarningNotification({
      uow,
      userId: inactiveUser.id,
      createdAt: subDays(now, 8),
    });

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 1 });
    expectToEqual(uow.outboxRepository.events.length, 1);
    const event = uow.outboxRepository.events[0];
    expectToEqual(event.topic, "InactiveUserAccountDeletionTriggered");
    expectToEqual(event.payload, {
      userId: inactiveUser.id,
      triggeredBy: { kind: "crawler" },
    });
    expectToEqual(event.wasQuarantined, true);
    expectToEqual(event.priority, 8);
  });

  it("only triggers deletion for users warned inside [warnedFrom, warnedTo]", async () => {
    const twoYearsAgo = subYears(now, 2);
    const warnedInsideWindow = makeUser({
      id: "warned-inside-id",
      email: "warned-inside@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const neverWarned = makeUser({
      id: "never-warned-id",
      email: "never-warned@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const warnedTooRecently = makeUser({
      id: "warned-too-recently-id",
      email: "warned-too-recently@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const warnedTooLongAgo = makeUser({
      id: "warned-too-long-ago-id",
      email: "warned-too-long-ago@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });

    uow.userRepository.users = [
      warnedInsideWindow,
      neverWarned,
      warnedTooRecently,
      warnedTooLongAgo,
    ];
    saveDeletionWarningNotification({
      uow,
      userId: warnedInsideWindow.id,
      createdAt: subDays(now, 8),
    });
    saveDeletionWarningNotification({
      uow,
      userId: warnedTooRecently.id,
      createdAt: subDays(now, 6),
    });
    saveDeletionWarningNotification({
      uow,
      userId: warnedTooLongAgo.id,
      createdAt: subDays(now, 11),
    });

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 1 });
    expectToEqual(uow.outboxRepository.events.length, 1);
    expectToEqual(uow.outboxRepository.events[0].payload, {
      userId: warnedInsideWindow.id,
      triggeredBy: { kind: "crawler" },
    });
  });

  it("processes warned inactive users in batches and skips the empty final batch", async () => {
    const countingUowPerformer = makeCountingUowPerformer(uow);
    triggerEventsToDeleteInactiveUsers = makeTriggerEventsToDeleteInactiveUsers(
      {
        deps: {
          uowPerformer: countingUowPerformer,
          timeGateway,
          createNewEvent: makeCreateNewEvent({
            timeGateway,
            uuidGenerator: new UuidV4Generator(),
          }),
          batchSize: 2,
        },
      },
    );
    const twoYearsAgo = subYears(now, 2);
    const users = makeInactiveUsers(3, twoYearsAgo);
    uow.userRepository.users = users;
    users.forEach((user) => {
      saveDeletionWarningNotification({
        uow,
        userId: user.id,
        createdAt: subDays(now, 8),
      });
    });

    const result = await triggerEventsToDeleteInactiveUsers.execute();

    expectToEqual(result, { numberOfDeletionsTriggered: 3 });
    expectToEqual(
      uow.outboxRepository.events.filter(
        (event) => event.topic === "InactiveUserAccountDeletionTriggered",
      ).length,
      3,
    );
    expectToEqual(countingUowPerformer.getCount(), 4);
  });
});

const makeInactiveUsers = (count: number, twoYearsAgo: Date) =>
  Array.from({ length: count }, (_, index) =>
    makeUser({
      id: `00000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`,
      email: `inactive-${index + 1}@test.fr`,
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    }),
  );

const makeCountingUowPerformer = (
  uow: UnitOfWork,
): UnitOfWorkPerformer & { getCount: () => number } => {
  let count = 0;
  return {
    perform: async (cb) => {
      count++;
      return cb(uow);
    },
    getCount: () => count,
  };
};

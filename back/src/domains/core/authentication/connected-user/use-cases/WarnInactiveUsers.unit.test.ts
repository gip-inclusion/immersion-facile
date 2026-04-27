import { addDays, subDays, subYears } from "date-fns";
import {
  type AbsoluteUrl,
  ConventionDtoBuilder,
  DiscussionBuilder,
  expectToEqual,
  frontRoutes,
  makeBooleanFeatureFlag,
} from "shared";
import {
  type ExpectSavedNotificationsBatchAndEvent,
  makeExpectSavedNotificationsBatchAndEvent,
} from "../../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../../notifications/helpers/Notification";
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
  makeWarnInactiveUsers,
  type WarnInactiveUsers,
} from "./WarnInactiveUsers";

const immersionBaseUrl: AbsoluteUrl = "https://immersion-facile.test";

const now = new Date("2026-01-15T10:00:00.000Z");

describe("WarnInactiveUsers", () => {
  let uow: InMemoryUnitOfWork;
  let warnInactiveUsers: WarnInactiveUsers;
  let expectSavedNotificationsBatchAndEvent: ExpectSavedNotificationsBatchAndEvent;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.featureFlagRepository.featureFlags = {
      enableInactiveUsersCleanup: makeBooleanFeatureFlag(true),
    };
    timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(now);

    expectSavedNotificationsBatchAndEvent =
      makeExpectSavedNotificationsBatchAndEvent(
        uow.notificationRepository,
        uow.outboxRepository,
      );

    warnInactiveUsers = makeWarnInactiveUsers({
      deps: {
        uowPerformer: new InMemoryUowPerformer(uow),
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(
            new UuidV4Generator(),
            timeGateway,
          ),
        timeGateway,
        immersionBaseUrl,
        batchSize: 2,
      },
    });
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

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 0 });
    expectToEqual(uow.outboxRepository.events.length, 0);
  });

  it("warns inactive and never-logged-in users, skips boundary-active user", async () => {
    const inactiveUser = makeUser({
      id: "inactive-id",
      email: "inactive@test.fr",
      firstName: "Marie",
      lastName: "Martin",
      lastLoginAt: subDays(subYears(now, 2), 1).toISOString(),
    });
    const boundaryActiveUser = makeUser({
      id: "boundary-id",
      email: "boundary@test.fr",
      lastLoginAt: subYears(now, 2).toISOString(),
    });
    const neverLoggedInUser = makeUser({
      id: "never-logged-id",
      email: "never@test.fr",
      firstName: "Paul",
      lastName: "Durand",
    });
    uow.userRepository.users = [
      inactiveUser,
      boundaryActiveUser,
      neverLoggedInUser,
    ];

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 2 });
    expectSavedNotificationsBatchAndEvent({
      emails: [
        {
          kind: "ACCOUNT_DELETION_WARNING",
          recipients: [inactiveUser.email],
          params: {
            fullName: `${inactiveUser.firstName} ${inactiveUser.lastName}`,
            deletionDate: "22 janvier 2026",
            loginUrl: `${immersionBaseUrl}/${frontRoutes.profile}`,
          },
        },
        {
          kind: "ACCOUNT_DELETION_WARNING",
          recipients: [neverLoggedInUser.email],
          params: {
            fullName: `${neverLoggedInUser.firstName} ${neverLoggedInUser.lastName}`,
            deletionDate: "22 janvier 2026",
            loginUrl: `${immersionBaseUrl}/${frontRoutes.profile}`,
          },
        },
      ],
    });
  });

  it("does not warn user with convention ending within 2-year window (future or 23 months ago)", async () => {
    setUsersWithRecentConventions({
      now,
      uow,
      users: [
        {
          id: "future-convention-user-id",
          email: "future-convention@test.fr",
        },
        {
          id: "recent-convention-user-id",
          email: "recent-convention@test.fr",
        },
      ],
    });

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 0 });
  });

  it("warns user with a recent convention whose status does not demonstrate activity", async () => {
    const twoYearsAgo = subYears(now, 2);
    const userWithRejected = makeUser({
      id: "rejected-user-id",
      email: "rejected-user@test.fr",
      firstName: "Reject",
      lastName: "Writer",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [userWithRejected];

    uow.conventionRepository.setConventions([
      new ConventionDtoBuilder()
        .withId("rejected-convention")
        .withBeneficiaryEmail(userWithRejected.email)
        .withDateEnd(addDays(now, 30).toISOString())
        .withStatus("REJECTED")
        .build(),
    ]);

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 1 });
  });

  it("does not warn user who sent a recent exchange as establishment (30 days ago or 23 months ago)", async () => {
    setUsersWithRecentEstablishmentExchanges({
      now,
      uow,
      users: [
        {
          id: "recent-exchange-user-id",
          email: "recent-exchange@test.fr",
        },
        {
          id: "old-exchange-user-id",
          email: "old-exchange@test.fr",
        },
      ],
    });

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 0 });
  });

  it("does not protect a user whose email only appears as potential beneficiary on a recent discussion", async () => {
    const twoYearsAgo = subYears(now, 2);
    const candidateOnlyUser = makeUser({
      id: "candidate-only-id",
      email: "candidate-only@test.fr",
      firstName: "Cand",
      lastName: "Only",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [candidateOnlyUser];

    uow.discussionRepository.discussions = [
      new DiscussionBuilder()
        .withId("discussion-candidate-only")
        .withPotentialBeneficiaryEmail(candidateOnlyUser.email)
        .withExchanges([
          {
            subject: "Candidate sent",
            message: "Hello",
            sentAt: subDays(now, 10).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build(),
    ];

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 1 });
  });

  it("warns user with expired convention and old establishment exchange", async () => {
    const twoYearsAgo = subYears(now, 2);
    const userWithOldActivity = makeUser({
      id: "old-activity-user-id",
      email: "old-activity@test.fr",
      firstName: "Expired",
      lastName: "Convention",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    setUserWithOldConventionAndDiscussion({
      now,
      uow,
      user: userWithOldActivity,
    });

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 1 });
    expectSavedNotificationsBatchAndEvent({
      emails: [
        {
          kind: "ACCOUNT_DELETION_WARNING",
          recipients: [userWithOldActivity.email],
          params: {
            fullName: `${userWithOldActivity.firstName} ${userWithOldActivity.lastName}`,
            deletionDate: "22 janvier 2026",
            loginUrl: `${immersionBaseUrl}/${frontRoutes.profile}`,
          },
        },
      ],
    });
  });

  it("does not re-warn a user who was already warned within the dedup window", async () => {
    const twoYearsAgo = subYears(now, 2);
    const recentlyWarnedUser = makeUser({
      id: "recently-warned-id",
      email: "recently-warned@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const freshCandidate = makeUser({
      id: "fresh-candidate-id",
      email: "fresh-candidate@test.fr",
      firstName: "Fresh",
      lastName: "Candidate",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [recentlyWarnedUser, freshCandidate];

    saveDeletionWarningNotification({
      uow,
      userId: recentlyWarnedUser.id,
      createdAt: subDays(now, 3),
    });

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 1 });
    const batchEvent = uow.outboxRepository.events.find(
      (e) => e.topic === "NotificationBatchAdded",
    );
    expectToEqual(batchEvent?.payload.length, 1);
    const newWarnings = uow.notificationRepository.notifications.filter(
      (n) =>
        n.kind === "email" &&
        n.templatedContent.kind === "ACCOUNT_DELETION_WARNING" &&
        n.followedIds.userId === freshCandidate.id,
    );
    expectToEqual(newWarnings.length, 1);
  });

  it("processes inactive users in batches and skips the empty final batch", async () => {
    const countingUowPerformer = makeCountingUowPerformer(uow);
    warnInactiveUsers = makeWarnInactiveUsers({
      deps: {
        uowPerformer: countingUowPerformer,
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(
            new UuidV4Generator(),
            timeGateway,
          ),
        timeGateway,
        immersionBaseUrl,
        batchSize: 2,
      },
    });
    const twoYearsAgo = subYears(now, 2);
    uow.userRepository.users = makeInactiveUsers(3, twoYearsAgo);

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 3 });
    expectToEqual(
      uow.outboxRepository.events
        .filter((event) => event.topic === "NotificationBatchAdded")
        .map((event) => event.payload.length),
      [2, 1],
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

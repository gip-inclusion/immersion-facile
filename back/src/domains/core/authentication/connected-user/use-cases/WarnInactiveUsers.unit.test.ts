import { addDays, subDays, subMonths, subYears } from "date-fns";
import {
  type AbsoluteUrl,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  expectToEqual,
  frontRoutes,
  type UserWithAdminRights,
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
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeWarnInactiveUsers,
  type WarnInactiveUsers,
} from "./WarnInactiveUsers";

const immersionBaseUrl: AbsoluteUrl = "https://immersion-facile.test";

const now = new Date("2026-01-15T10:00:00.000Z");

const makeUser = (
  overrides: Partial<UserWithAdminRights> & { id: string; email: string },
): UserWithAdminRights => ({
  ...new ConnectedUserBuilder()
    .withId(overrides.id)
    .withEmail(overrides.email)
    .withFirstName(overrides.firstName ?? "Jean")
    .withLastName(overrides.lastName ?? "Dupont")
    .buildUser(),
  lastLoginAt: overrides.lastLoginAt,
});

describe("WarnInactiveUsers", () => {
  let uow: InMemoryUnitOfWork;
  let warnInactiveUsers: WarnInactiveUsers;
  let expectSavedNotificationsBatchAndEvent: ExpectSavedNotificationsBatchAndEvent;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(now);

    expectSavedNotificationsBatchAndEvent =
      makeExpectSavedNotificationsBatchAndEvent(
        uow.notificationRepository,
        uow.outboxRepository,
      );

    warnInactiveUsers = makeWarnInactiveUsers({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(
            new UuidV4Generator(),
            timeGateway,
          ),
        timeGateway,
        immersionBaseUrl,
      },
    });
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
    const twoYearsAgo = subYears(now, 2);
    const userWithFutureConvention = makeUser({
      id: "future-convention-user-id",
      email: "future-convention@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const userWith23MonthOldConvention = makeUser({
      id: "recent-convention-user-id",
      email: "recent-convention@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [
      userWithFutureConvention,
      userWith23MonthOldConvention,
    ];

    uow.conventionRepository.setConventions([
      new ConventionDtoBuilder()
        .withId("convention-future")
        .withBeneficiaryEmail(userWithFutureConvention.email)
        .withDateEnd(addDays(now, 30).toISOString())
        .build(),
      new ConventionDtoBuilder()
        .withId("convention-23m")
        .withBeneficiaryEmail(userWith23MonthOldConvention.email)
        .withDateEnd(subMonths(now, 23).toISOString())
        .build(),
    ]);

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 0 });
  });

  it("does not warn user with exchange within 2-year window (30 days ago or 23 months ago)", async () => {
    const twoYearsAgo = subYears(now, 2);
    const userWithRecentExchange = makeUser({
      id: "recent-exchange-user-id",
      email: "recent-exchange@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    const userWith23MonthOldExchange = makeUser({
      id: "old-exchange-user-id",
      email: "old-exchange@test.fr",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [
      userWithRecentExchange,
      userWith23MonthOldExchange,
    ];

    uow.discussionRepository.discussions = [
      new DiscussionBuilder()
        .withId("discussion-recent")
        .withPotentialBeneficiaryEmail(userWithRecentExchange.email)
        .withExchanges([
          {
            subject: "Test",
            message: "Hello",
            sentAt: subDays(now, 30).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build(),
      new DiscussionBuilder()
        .withId("discussion-23m")
        .withPotentialBeneficiaryEmail(userWith23MonthOldExchange.email)
        .withExchanges([
          {
            subject: "Recent enough",
            message: "Hello",
            sentAt: subMonths(now, 23).toISOString(),
            sender: "potentialBeneficiary",
            attachments: [],
          },
        ])
        .build(),
    ];

    const result = await warnInactiveUsers.execute();

    expectToEqual(result, { numberOfWarningsSent: 0 });
  });

  it("warns user with expired convention and old discussion", async () => {
    const twoYearsAgo = subYears(now, 2);
    const userWithOldActivity = makeUser({
      id: "old-activity-user-id",
      email: "old-activity@test.fr",
      firstName: "Expired",
      lastName: "Convention",
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    });
    uow.userRepository.users = [userWithOldActivity];

    const oldConvention = new ConventionDtoBuilder()
      .withId("old-convention-1")
      .withBeneficiaryEmail(userWithOldActivity.email)
      .withDateEnd(subDays(twoYearsAgo, 10).toISOString())
      .build();
    uow.conventionRepository.setConventions([oldConvention]);

    const oldDiscussion = new DiscussionBuilder()
      .withId("old-discussion-1")
      .withPotentialBeneficiaryEmail(userWithOldActivity.email)
      .withExchanges([
        {
          subject: "Old",
          message: "Old exchange",
          sentAt: subDays(twoYearsAgo, 10).toISOString(),
          sender: "potentialBeneficiary",
          attachments: [],
        },
      ])
      .build();
    uow.discussionRepository.discussions = [oldDiscussion];

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
});

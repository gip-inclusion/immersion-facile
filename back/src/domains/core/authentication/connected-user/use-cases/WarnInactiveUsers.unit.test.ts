import { subDays, subYears } from "date-fns";
import {
  type AbsoluteUrl,
  ConnectedUserBuilder,
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
});

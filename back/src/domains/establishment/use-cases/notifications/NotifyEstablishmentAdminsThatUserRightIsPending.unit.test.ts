import {
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
  UserBuilder,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import {
  makeSaveNotificationAndRelatedEvent,
  type SaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import {
  makeNotifyEstablishmentAdminsThatUserRightIsPending,
  type NotifyEstablishmentAdminsThatUserRightIsPending,
  type NotifyEstablishmentAdminsThatUserRightIsPendingRequestedPayload,
} from "./NotifyEstablishmentAdminsThatUserRightIsPending";

describe("NotifyEstablishmentAdminsThatUserRightIsPending", () => {
  let uow: InMemoryUnitOfWork;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let config: AppConfig;
  let notifyEstablishmentAdminsThatUserRightIsPending: NotifyEstablishmentAdminsThatUserRightIsPending;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  const adminUser = new UserBuilder()
    .withId("admin")
    .withEmail("admin@example.com")
    .build();
  const pendingUser = new UserBuilder()
    .withId("pending-user")
    .withEmail("pending-user@example.com")
    .build();
  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        userId: adminUser.id,
        status: "ACCEPTED",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "osef",
        phone: "0600000000",
      },
    ])
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      new CustomTimeGateway(),
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    config = new AppConfigBuilder().build();
    notifyEstablishmentAdminsThatUserRightIsPending =
      makeNotifyEstablishmentAdminsThatUserRightIsPending({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: { saveNotificationAndRelatedEvent, config },
      });
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];
    uow.userRepository.users = [adminUser, pendingUser];
  });

  describe("Wrong path", () => {
    it("should throw an error if the establishment is not found", async () => {
      await expectPromiseToFailWithError(
        notifyEstablishmentAdminsThatUserRightIsPending.execute({
          siret: "12345678900000",
          userId: pendingUser.id,
          role: "establishment-contact",
        }),
        errors.establishment.notFound({ siret: "12345678900000" }),
      );
    });
    it("should throw an error if the admin user is not found", async () => {
      uow.userRepository.users = [];
      await expectPromiseToFailWithError(
        notifyEstablishmentAdminsThatUserRightIsPending.execute({
          siret: establishmentAggregate.establishment.siret,
          userId: pendingUser.id,
          role: "establishment-contact",
        }),
        errors.users.notFound({ userIds: [adminUser.id] }),
      );
    });
    it("should throw an error if the pending user is not found", async () => {
      uow.userRepository.users = [adminUser];
      await expectPromiseToFailWithError(
        notifyEstablishmentAdminsThatUserRightIsPending.execute({
          siret: establishmentAggregate.establishment.siret,
          userId: "12345678900000",
          role: "establishment-contact",
        }),
        errors.user.notFound({ userId: "12345678900000" }),
      );
    });

    it("should throw an error if the establishment has no admins", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        {
          ...establishmentAggregate,
          userRights: [
            {
              role: "establishment-contact",
              userId: adminUser.id,
              status: "ACCEPTED",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
              job: "osef",
              phone: "0600000000",
            },
          ],
        },
      ];
      await expectPromiseToFailWithError(
        notifyEstablishmentAdminsThatUserRightIsPending.execute({
          siret: establishmentAggregate.establishment.siret,
          userId: pendingUser.id,
          role: "establishment-admin",
        }),
        errors.establishment.adminNotFound({
          siret: establishmentAggregate.establishment.siret,
        }),
      );
    });

    it("should throw an error if the admin user right is not accepted", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        {
          ...establishmentAggregate,
          userRights: [
            {
              role: "establishment-admin",
              userId: adminUser.id,
              status: "PENDING",
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
              job: "osef",
              phone: "0600000000",
            },
          ],
        },
      ];
      await expectPromiseToFailWithError(
        notifyEstablishmentAdminsThatUserRightIsPending.execute({
          siret: establishmentAggregate.establishment.siret,
          userId: pendingUser.id,
          role: "establishment-admin",
        }),
        errors.establishment.adminNotFound({
          siret: establishmentAggregate.establishment.siret,
        }),
      );
    });
  });
  describe("Right path", () => {
    it("should notify the establishment admins that the user right is pending", async () => {
      const pendingUserRequest: NotifyEstablishmentAdminsThatUserRightIsPendingRequestedPayload =
        {
          siret: establishmentAggregate.establishment.siret,
          userId: pendingUser.id,
          role: "establishment-contact",
        };
      await notifyEstablishmentAdminsThatUserRightIsPending.execute(
        pendingUserRequest,
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_USER_RIGHT_IS_PENDING",
            recipients: [adminUser.email],
            params: {
              establishmentDashboardUrl: `${config.immersionFacileBaseUrl}/${frontRoutes.establishmentDashboard}`,
              adminFirstName: adminUser.firstName,
              adminLastName: adminUser.lastName,
              pendingUserFirstName: pendingUser.firstName,
              pendingUserLastName: pendingUser.lastName,
              pendingUserRole: pendingUserRequest.role,
              pendingUserEmail: pendingUser.email,
            },
          },
        ],
      });
    });
  });
});

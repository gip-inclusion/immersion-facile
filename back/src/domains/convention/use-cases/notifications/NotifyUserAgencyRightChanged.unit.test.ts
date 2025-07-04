import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyUserAgencyRightChanged } from "./NotifyUserAgencyRightChanged";

describe("NotifyUserAgencyRightChanged", () => {
  const user = new ConnectedUserBuilder()
    .withEmail("user@email.fr")
    .withId("jbab-123")
    .buildUser();
  const agency = new AgencyDtoBuilder()
    .withId("agency-1")
    .withName("Agence de limoges")
    .build();

  let uow: InMemoryUnitOfWork;
  let notifyUserAgencyRightChanged: NotifyUserAgencyRightChanged;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    notifyUserAgencyRightChanged = new NotifyUserAgencyRightChanged(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );
  });

  describe("Wrong paths", () => {
    it("throw error when no agency found", async () => {
      await expectPromiseToFailWithError(
        notifyUserAgencyRightChanged.execute({
          agencyId: agency.id,
          userId: user.id,
        }),
        errors.agency.notFound({ agencyId: agency.id }),
      );

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });

    it("throw error when no user found", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      await expectPromiseToFailWithError(
        notifyUserAgencyRightChanged.execute({
          agencyId: agency.id,
          userId: user.id,
        }),
        errors.user.notFound({ userId: user.id }),
      );

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });

    it("does nothing when user has no rights on agency", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
      uow.userRepository.users = [user];

      await notifyUserAgencyRightChanged.execute({
        agencyId: agency.id,
        userId: user.id,
      });

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });
  });

  describe("Right paths", () => {
    beforeEach(() => {
      uow.userRepository.users = [user];
    });

    it("Sends an email to counsellors with agency name", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        }),
      ];

      await notifyUserAgencyRightChanged.execute({
        agencyId: agency.id,
        userId: user.id,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "IC_USER_RIGHTS_HAS_CHANGED",
            params: {
              agencyName: agency.name,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
            recipients: [user.email],
          },
        ],
      });
    });

    it("Sends an email to validators with agency name", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        }),
      ];

      await notifyUserAgencyRightChanged.execute({
        agencyId: agency.id,
        userId: user.id,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "IC_USER_RIGHTS_HAS_CHANGED",
            params: {
              agencyName: agency.name,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              isNotifiedByEmail: false,
              roles: ["validator"],
            },
            recipients: [user.email],
          },
        ],
      });
    });

    it("Should not sends an email to validators with agency name when the new role is: to review", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [user.id]: { isNotifiedByEmail: false, roles: ["to-review"] },
        }),
      ];

      await notifyUserAgencyRightChanged.execute({
        agencyId: agency.id,
        userId: user.id,
      });

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });
  });
});

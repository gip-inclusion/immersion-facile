import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { NotifyIcUserAgencyRightChanged } from "./NotifyIcUserAgencyRightChanged";

describe("SendEmailWhenAgencyIsActivated", () => {
  const user = new InclusionConnectedUserBuilder()
    .withEmail("user@email.fr")
    .withId("jbab-123")
    .buildUser();
  const agency = new AgencyDtoBuilder()
    .withId("agency-1")
    .withName("Agence de limoges")
    .build();

  let uow: InMemoryUnitOfWork;
  let notifyIcUserAgencyRightChanged: NotifyIcUserAgencyRightChanged;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    notifyIcUserAgencyRightChanged = new NotifyIcUserAgencyRightChanged(
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
        notifyIcUserAgencyRightChanged.execute({
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
        notifyIcUserAgencyRightChanged.execute({
          agencyId: agency.id,
          userId: user.id,
        }),
        errors.user.notFound({ userId: user.id }),
      );

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });

    it("throw error when no user has no rights on agency", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
      uow.userRepository.users = [user];

      await expectPromiseToFailWithError(
        notifyIcUserAgencyRightChanged.execute({
          agencyId: agency.id,
          userId: user.id,
        }),
        errors.user.noRightsOnAgency({ userId: user.id, agencyId: agency.id }),
      );

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

      await notifyIcUserAgencyRightChanged.execute({
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

      await notifyIcUserAgencyRightChanged.execute({
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

      await notifyIcUserAgencyRightChanged.execute({
        agencyId: agency.id,
        userId: user.id,
      });

      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });
  });
});

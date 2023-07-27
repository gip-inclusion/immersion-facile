import {
  AgencyDtoBuilder,
  expectPromiseToFailWith,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
} from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotifyIcUserAgencyRightChanged } from "./NotifyIcUserAgencyRightChanged";

const icUserRoleParams: IcUserRoleForAgencyParams = {
  role: "counsellor",
  agencyId: "agency-1",
  userId: "jbab-123",
};

describe("SendEmailWhenAgencyIsActivated", () => {
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let notifyIcUserAgencyRightChanged: NotifyIcUserAgencyRightChanged;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    notifyIcUserAgencyRightChanged = new NotifyIcUserAgencyRightChanged(
      uowPerformer,
      saveNotificationAndRelatedEvent,
    );
  });

  it("throw error when no agency found", async () => {
    await expectPromiseToFailWith(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      `Unable to send mail. No agency config found for ${icUserRoleParams.agencyId}`,
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("throw error when no user found", async () => {
    const agency = new AgencyDtoBuilder()
      .withId("agency-1")
      .withName("Agence de limoges ")
      .build();

    uow.agencyRepository.setAgencies([agency]);

    await expectPromiseToFailWith(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      `User with id ${icUserRoleParams.userId} not found`,
    );

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });

  it("Sends an email to validators with agency name", async () => {
    const agency = new AgencyDtoBuilder()
      .withId("agency-1")
      .withName("Agence de limoges")
      .build();

    uow.agencyRepository.setAgencies([agency]);

    const icUser: InclusionConnectedUser = {
      email: "fake-user@inclusion-connect.fr",
      firstName: "jean",
      lastName: "babouche",
      id: "jbab-123",
      dashboardUrl: "https://placeholder.com/",
      agencyRights: [
        {
          role: "toReview",
          agency,
        },
      ],
    };
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await notifyIcUserAgencyRightChanged.execute(icUserRoleParams);

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "IC_USER_RIGHTS_HAS_CHANGED",
          params: { agencyName: agency.name },
          recipients: [icUser.email],
        },
      ],
    });
  });

  it("Should not sends an email to validators with agency name when the new role is: to review", async () => {
    const agency = new AgencyDtoBuilder()
      .withId("agency-1")
      .withName("Agence de limoges")
      .build();

    uow.agencyRepository.setAgencies([agency]);

    const icUser: InclusionConnectedUser = {
      email: "fake-user@inclusion-connect.fr",
      firstName: "jean",
      lastName: "babouche",
      id: "jbab-123",
      dashboardUrl: "https://placeholder.com/",
      agencyRights: [
        {
          role: "validator",
          agency,
        },
      ],
    };
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await notifyIcUserAgencyRightChanged.execute({
      role: "toReview",
      agencyId: "agency-1",
      userId: "jbab-123",
    });

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });
});

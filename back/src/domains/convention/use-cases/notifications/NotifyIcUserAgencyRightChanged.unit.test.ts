import {
  AgencyDtoBuilder,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  expectPromiseToFailWith,
} from "shared";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
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
      dashboards: {
        agencies: { agencyDashboardUrl: "https://placeholder.com/" },
        establishments: {},
      },
      agencyRights: [
        {
          role: "toReview",
          agency,
        },
      ],
      externalId: "jean-external-id",
      createdAt: new Date().toISOString(),
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
      dashboards: {
        agencies: { agencyDashboardUrl: "https://placeholder.com/" },
        establishments: {},
      },
      agencyRights: [
        {
          role: "validator",
          agency,
        },
      ],
      externalId: "jean-external-id",
      createdAt: new Date().toISOString(),
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

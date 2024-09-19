import {
  AgencyDtoBuilder,
  InclusionConnectedUser,
  UserParamsForAgency,
  errors,
  expectPromiseToFailWithError,
} from "shared";
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

const icUserRoleParams: UserParamsForAgency = {
  roles: ["counsellor"],
  agencyId: "agency-1",
  userId: "jbab-123",
  isNotifiedByEmail: false,
  email: "icUserRoleParams@email.fr",
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
    await expectPromiseToFailWithError(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      errors.agency.notFound({ agencyId: icUserRoleParams.agencyId }),
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

    await expectPromiseToFailWithError(
      notifyIcUserAgencyRightChanged.execute(icUserRoleParams),
      errors.user.notFound({ userId: icUserRoleParams.userId }),
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
          roles: ["to-review"],
          agency,
          isNotifiedByEmail: false,
        },
      ],
      externalId: "jean-external-id",
      createdAt: new Date().toISOString(),
    };
    uow.userRepository.setInclusionConnectedUsers([icUser]);

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
          roles: ["validator"],
          agency,
          isNotifiedByEmail: false,
        },
      ],
      externalId: "jean-external-id",
      createdAt: new Date().toISOString(),
    };
    uow.userRepository.setInclusionConnectedUsers([icUser]);

    await notifyIcUserAgencyRightChanged.execute({
      roles: ["to-review"],
      agencyId: "agency-1",
      userId: icUser.id,
      isNotifiedByEmail: false,
      email: icUser.email,
    });

    expectSavedNotificationsAndEvents({
      emails: [],
    });
  });
});

import {
  AgencyDtoBuilder,
  InclusionConnectedUser,
  User,
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
import { NotifyIcUserAgencyRightRejected } from "./NotifyIcUserAgencyRightRejected";

const agency = new AgencyDtoBuilder().withId("agency-1").build();

const user: User = {
  id: "john-123",
  email: "john@mail.com",
  firstName: "John",
  lastName: "Lennon",
  externalId: "john-external-id",
  createdAt: new Date().toISOString(),
};

const icUser: InclusionConnectedUser = {
  ...user,
  agencyRights: [],
  dashboards: {
    agencies: {},
    establishments: {},
  },
};

describe("Notify icUser agency right rejected", () => {
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let notifyIcUserAgencyRightRejected: NotifyIcUserAgencyRightRejected;
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
    notifyIcUserAgencyRightRejected = new NotifyIcUserAgencyRightRejected(
      uowPerformer,
      saveNotificationAndRelatedEvent,
    );
  });

  it("Throw when no agency were found", async () => {
    await expectPromiseToFailWithError(
      notifyIcUserAgencyRightRejected.execute({
        agencyId: agency.id,
        justification: "osef",
        userId: icUser.id,
      }),
      errors.agency.notFound({ agencyId: agency.id }),
    );
  });

  it("Throw when no icUser were found", async () => {
    uow.agencyRepository.setAgencies([agency]);

    await expectPromiseToFailWithError(
      notifyIcUserAgencyRightRejected.execute({
        agencyId: agency.id,
        justification: "osef",
        userId: icUser.id,
      }),
      errors.user.notFound({
        userId: icUser.id,
      }),
    );
  });

  it("Send an email to icUser to notify that registration to agency was rejected", async () => {
    uow.agencyRepository.setAgencies([agency]);
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

    await notifyIcUserAgencyRightRejected.execute({
      agencyId: agency.id,
      justification: "osef",
      userId: icUser.id,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "IC_USER_REGISTRATION_TO_AGENCY_REJECTED",
          params: { agencyName: agency.name, justification: "osef" },
          recipients: [icUser.email],
        },
      ],
    });
  });
});

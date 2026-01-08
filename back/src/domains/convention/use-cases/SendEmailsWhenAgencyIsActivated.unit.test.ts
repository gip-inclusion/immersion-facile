import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailsWhenAgencyIsActivated } from "./SendEmailsWhenAgencyIsActivated";

const connectedUser1 = new ConnectedUserBuilder()
  .withId("user-1-id")
  .withFirstName("jean")
  .withLastName("Dupont")
  .withEmail("jean-dupont@mail.com")
  .build();

const connectedUser2 = new ConnectedUserBuilder()
  .withId("user-2-id")
  .withFirstName("Pierre")
  .withLastName("Durand")
  .withEmail("pierre-durand@mail.com")
  .build();

const connectedUser3 = new ConnectedUserBuilder()
  .withId("user-3-id")
  .withFirstName("Jeanne")
  .withLastName("Ferrand")
  .withEmail("jeanne-ferrand@mail.com")
  .buildUser();

describe("SendEmailWhenAgencyIsActivated", () => {
  const agency = new AgencyDtoBuilder()
    .withName("just-activated-agency")
    .withLogoUrl("https://agency-logo.com")
    .build();

  const agencyWithRights = toAgencyWithRights(agency, {
    [connectedUser1.id]: { roles: ["validator"], isNotifiedByEmail: true },
    [connectedUser2.id]: { roles: ["counsellor"], isNotifiedByEmail: true },
  });

  const agencyWithRefersTo = new AgencyDtoBuilder()
    .withId("id-of-agency-refering-to-other")
    .withRefersToAgencyInfo({
      refersToAgencyId: agency.id,
      refersToAgencyName: agency.name,
      refersToAgencyContactEmail: agency.agencyContactEmail,
    })
    .withName("just-activated-agency-refering-to-other-one")
    .withLogoUrl("https://agency-refering-logo.com")
    .build();

  const agencyWithRefersToWithRights = toAgencyWithRights(agencyWithRefersTo, {
    [connectedUser3.id]: { roles: ["counsellor"], isNotifiedByEmail: true },
    [connectedUser1.id]: { roles: ["validator"], isNotifiedByEmail: true },
  });

  let uow: InMemoryUnitOfWork;
  let sendEmailsWhenAgencyActivated: SendEmailsWhenAgencyIsActivated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.userRepository.users = [connectedUser1, connectedUser2, connectedUser3];
    uow.agencyRepository.agencies = [agencyWithRights];
    const uowPerformer = new InMemoryUowPerformer(uow);
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    sendEmailsWhenAgencyActivated = new SendEmailsWhenAgencyIsActivated(
      uowPerformer,
      saveNotificationAndRelatedEvent,
    );
  });

  it("Sends activation email to counsellors and validators when agency without refers to id got activated", async () => {
    uow.agencyRepository.agencies = [agencyWithRights];
    // Act
    await sendEmailsWhenAgencyActivated.execute({ agencyId: agency.id });

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_WAS_ACTIVATED",
          recipients: [connectedUser1.email, connectedUser2.email],
          params: {
            agencyName: "just-activated-agency",
            agencyLogoUrl: "https://agency-logo.com",
            refersToOtherAgency: false,
            agencyReferdToName: undefined,
            users: [
              {
                firstName: connectedUser1.firstName,
                lastName: connectedUser1.lastName,
                email: connectedUser1.email,
                agencyName: agency.name,
                isNotifiedByEmail: true,
                roles: ["validator"],
              },
              {
                firstName: connectedUser2.firstName,
                lastName: connectedUser2.lastName,
                email: connectedUser2.email,
                agencyName: agency.name,
                isNotifiedByEmail: true,
                roles: ["counsellor"],
              },
            ],
          },
        },
      ],
    });
  });

  it("throw not found error if no agency were found with agency refers to id when agency refering to other activated", async () => {
    uow.agencyRepository.agencies = [agencyWithRefersToWithRights];
    await expectPromiseToFailWithError(
      sendEmailsWhenAgencyActivated.execute({
        agencyId: agencyWithRefersTo.id,
      }),
      errors.agency.notFound({ agencyId: agency.id }),
    );
  });

  it("send a notification email to validating agency when agency refering to other was activated and one activation email to the counsellors of the agency refering to other", async () => {
    uow.agencyRepository.agencies = [
      agencyWithRights,
      agencyWithRefersToWithRights,
    ];

    await sendEmailsWhenAgencyActivated.execute({
      agencyId: agencyWithRefersTo.id,
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_WAS_ACTIVATED",
          recipients: [connectedUser3.email],
          params: {
            agencyName: agencyWithRefersTo.name,
            agencyLogoUrl: "https://agency-refering-logo.com",
            refersToOtherAgency: true,
            agencyReferdToName: agency.name,
            users: [
              {
                firstName: connectedUser3.firstName,
                lastName: connectedUser3.lastName,
                email: connectedUser3.email,
                agencyName: agencyWithRefersTo.name,
                isNotifiedByEmail: true,
                roles: ["counsellor"],
              },
            ],
          },
        },
        {
          kind: "AGENCY_WITH_REFERS_TO_ACTIVATED",
          recipients: [connectedUser1.email],
          params: {
            agencyLogoUrl: "https://agency-logo.com",
            nameOfAgencyRefering: agencyWithRefersTo.name,
            refersToAgencyName: agency.name,
            validatorEmails: [connectedUser1.email],
          },
        },
      ],
    });
  });
});

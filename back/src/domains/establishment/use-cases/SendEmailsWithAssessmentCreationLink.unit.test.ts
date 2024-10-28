import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  InclusionConnectedUserBuilder,
  Notification,
  TemplatedEmail,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import {
  SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailsWithAssessmentCreationLink } from "./SendEmailsWithAssessmentCreationLink";

describe("SendEmailWithAssessmentCreationLink", () => {
  const id: ConventionId = "immersion-ending-yesterday-id";

  let uow: InMemoryUnitOfWork;
  let sendEmailWithAssessmentCreationLink: SendEmailsWithAssessmentCreationLink;
  let timeGateway: CustomTimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    sendEmailWithAssessmentCreationLink =
      new SendEmailsWithAssessmentCreationLink(
        new InMemoryUowPerformer(uow),
        saveNotificationAndRelatedEvent,
        timeGateway,
        fakeGenerateMagicLinkUrlFn,
        makeCreateNewEvent({
          timeGateway,
          uuidGenerator: new UuidV4Generator(),
        }),
      );
  });

  it("Sends an email to immersions that end yesterday", async () => {
    // Arrange
    const expectedAgency = new AgencyDtoBuilder()
      .withLogoUrl("http://LOGO AGENCY IF URL")
      .build();
    const counsellor = new InclusionConnectedUserBuilder()
      .withId("counsellor")
      .withEmail("counsellor@mail.com")
      .build();

    const immersionApplicationEndingYesterday = new ConventionDtoBuilder()
      .withAgencyId(expectedAgency.id)
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-14T10:00:00.000Z")
      .withId(id)
      .withEstablishmentTutorFirstName("Tom")
      .withEstablishmentTutorLastName("Cruise")
      .validated()
      .build();
    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withAgencyId(expectedAgency.id)
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .validated()
      .build();

    uow.agencyRepository.agencies = [
      toAgencyWithRights(expectedAgency, {
        [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
      }),
    ];
    uow.userRepository.users = [counsellor];

    await uow.conventionRepository.save(immersionApplicationEndingTomorrow);
    await uow.conventionRepository.save(immersionApplicationEndingYesterday);
    const now = new Date("2021-05-15T08:00:00.000Z");
    timeGateway.setNextDates([now, now]);

    // Act
    await sendEmailWithAssessmentCreationLink.execute({
      conventionEndDate: {
        from: subDays(now, 1),
        to: now,
      },
    });

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ESTABLISHMENT_ASSESSMENT_NOTIFICATION",
          params: {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            agencyLogoUrl: expectedAgency.logoUrl!,
            beneficiaryFirstName: "Esteban",
            beneficiaryLastName: "Ocon",
            conventionId: "immersion-ending-yesterday-id",
            establishmentTutorName: "Tom Cruise",
            assessmentCreationLink:
              "http://fake-magic-link/bilan-immersion/immersion-ending-yesterday-id/establishment-tutor/2021-05-15T08:00:00.000Z/establishment@example.com",
            internshipKind: "immersion",
          },
          recipients: ["establishment@example.com"],
          sender: {
            email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
            name: "Immersion Facilitée",
          },
        },
      ],
    });

    expect(uow.outboxRepository.events).toHaveLength(2);
    expectToEqual(uow.outboxRepository.events[0].topic, "NotificationAdded");
    expect(uow.outboxRepository.events[1].payload).toMatchObject({
      id,
    });
    expectObjectsToMatch(uow.outboxRepository.events[1], {
      topic: "EmailWithLinkToCreateAssessmentSent",
      payload: { id },
    });
  });

  it("Does not send an email to immersions having already received one", async () => {
    // Arrange
    const agency = new AgencyDtoBuilder().build();
    const immersionApplicationEndingYesterday = new ConventionDtoBuilder()
      .withDateEnd("2021-05-14T10:00:00.000Z")
      .validated()
      .withAgencyId(agency.id)
      .withId(id)
      .build();
    const signatories = immersionApplicationEndingYesterday.signatories;

    const email: TemplatedEmail = {
      kind: "ESTABLISHMENT_ASSESSMENT_NOTIFICATION",
      params: {
        internshipKind: "immersion",
        assessmentCreationLink:
          "http://fake-magic-link/bilan-immersion/immersion-ending-yesterday-id/establishment-tutor/2021-09-01T10:10:00.000Z/establishment@example.com",
        beneficiaryFirstName: signatories.beneficiary.firstName,
        beneficiaryLastName: signatories.beneficiary.lastName,
        conventionId: immersionApplicationEndingYesterday.id,
        establishmentTutorName: `${immersionApplicationEndingYesterday.establishmentTutor.firstName} ${immersionApplicationEndingYesterday.establishmentTutor.lastName}`,
        agencyLogoUrl: undefined,
      },
      recipients: [signatories.establishmentRepresentative.email],
      sender: {
        email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
        name: "Immersion Facilitée",
      },
    };

    const notification: Notification = {
      createdAt: new Date().toISOString(),
      followedIds: {
        conventionId: immersionApplicationEndingYesterday.id,
        agencyId: immersionApplicationEndingYesterday.agencyId,
        establishmentSiret: immersionApplicationEndingYesterday.siret,
      },
      id: "first-notification-added-manually",
      kind: "email",
      templatedContent: email,
    };

    uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
    uow.conventionRepository.setConventions([
      immersionApplicationEndingYesterday,
    ]);

    uow.notificationRepository.notifications = [notification];

    expectToEqual(uow.notificationRepository.notifications, [notification]);
    expectToEqual(uow.outboxRepository.events, []);

    // Act
    const now = timeGateway.now();
    await sendEmailWithAssessmentCreationLink.execute({
      conventionEndDate: {
        from: subDays(timeGateway.now(), 1),
        to: now,
      },
    });

    // Assert
    expectToEqual(uow.notificationRepository.notifications, [notification]);
    expectToEqual(uow.outboxRepository.events, []);
  });
});

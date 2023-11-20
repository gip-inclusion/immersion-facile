import { ConventionDtoBuilder, ConventionId, expectToEqual } from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { SendEmailsWithAssessmentCreationLink } from "./SendEmailsWithAssessmentCreationLink";

describe("SendEmailWithAssessmentCreationLink", () => {
  const id: ConventionId = "immersion-ending-tomorrow-id";

  let uow: InMemoryUnitOfWork;
  let sendEmailWithAssessmentCreationLink: SendEmailsWithAssessmentCreationLink;
  let timeGateway: CustomTimeGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
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

  it("Sends an email to immersions ending tomorrow", async () => {
    // Arrange
    const expectedAgency = uow.agencyRepository.agencies[0];
    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withAgencyId(expectedAgency.id)
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .withId(id)
      .withEstablishmentTutorFirstName("Tom")
      .withEstablishmentTutorLastName("Cruise")
      .validated()
      .build();
    const immersionApplicationEndingYesterday = new ConventionDtoBuilder()
      .withAgencyId(expectedAgency.id)
      .withDateEnd("2021-05-14T10:00:00.000Z")
      .validated()
      .build();

    await uow.conventionRepository.save(immersionApplicationEndingTomorrow);
    await uow.conventionRepository.save(immersionApplicationEndingYesterday);
    const now = new Date("2021-05-15T08:00:00.000Z");
    timeGateway.setNextDates([now, now]);

    // Act
    await sendEmailWithAssessmentCreationLink.execute();

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "CREATE_ASSESSMENT",
          params: {
            agencyAssessmentDocumentLink: undefined,
            agencyLogoUrl: "http://LOGO AGENCY IF URL",
            agencyValidatorEmail: "validator123@mail.com",
            beneficiaryFirstName: "Esteban",
            beneficiaryLastName: "Ocon",
            conventionId: "immersion-ending-tomorrow-id",
            establishmentTutorName: "Tom Cruise",
            assessmentCreationLink:
              "http://fake-magic-link/bilan-immersion/immersion-ending-tomorrow-id/establishment-tutor/2021-05-15T08:00:00.000Z/establishment@example.com",
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
    expectToEqual(
      uow.outboxRepository.events[1].topic,
      "EmailWithLinkToCreateAssessmentSent",
    );
  });

  it("Does not send an email to immersions having already received one", async () => {
    // Arrange
    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .validated()
      .withId(id)
      .build();
    await uow.conventionRepository.save(immersionApplicationEndingTomorrow);
    await uow.outboxRepository.save({
      topic: "EmailWithLinkToCreateAssessmentSent",
      payload: { id: immersionApplicationEndingTomorrow.id },
    } as DomainEvent);

    timeGateway.setNextDate(new Date("2021-05-15T08:00:00.000Z"));

    // Act
    await sendEmailWithAssessmentCreationLink.execute();

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [],
    });
    expect(uow.outboxRepository.events).toHaveLength(1);
    expectToEqual(
      uow.outboxRepository.events[0].topic,
      "EmailWithLinkToCreateAssessmentSent",
    );
  });
});

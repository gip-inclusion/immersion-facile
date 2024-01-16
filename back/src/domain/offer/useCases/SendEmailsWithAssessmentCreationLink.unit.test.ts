import { ConventionDtoBuilder, ConventionId, expectToEqual } from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { SendEmailsWithAssessmentCreationLink } from "./SendEmailsWithAssessmentCreationLink";

describe("SendEmailWithAssessmentCreationLink", () => {
  const id: ConventionId = "immersion-ending-yesterday-id";

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

  it("Sends an email to immersions that end yesterday", async () => {
    // Arrange
    const expectedAgency = uow.agencyRepository.agencies[0];
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
          kind: "ESTABLISHMENT_ASSESSMENT_NOTIFICATION",
          params: {
            agencyLogoUrl: "http://LOGO AGENCY IF URL",
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
    expectToEqual(
      uow.outboxRepository.events[1].topic,
      "EmailWithLinkToCreateAssessmentSent",
    );
  });

  it("Does not send an email to immersions having already received one", async () => {
    // Arrange
    const immersionApplicationEndingYesterday = new ConventionDtoBuilder()
      .withDateEnd("2021-05-14T10:00:00.000Z")
      .validated()
      .withId(id)
      .build();
    await uow.conventionRepository.save(immersionApplicationEndingYesterday);
    await uow.outboxRepository.save({
      topic: "EmailWithLinkToCreateAssessmentSent",
      payload: { id: immersionApplicationEndingYesterday.id },
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

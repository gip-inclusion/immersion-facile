import {
  ConventionDtoBuilder,
  ConventionId,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/jwtTestHelper";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { SendEmailsWithAssessmentCreationLink } from "./SendEmailsWithAssessmentCreationLink";

describe("SendEmailWithImmersionAssessmentCreationLink", () => {
  const id: ConventionId = "immersion-ending-tomorrow-id";

  let uow: InMemoryUnitOfWork;
  let sendEmailWithAssessmentCreationLink: SendEmailsWithAssessmentCreationLink;
  let timeGateway: CustomTimeGateway;
  let notificationGateway: InMemoryNotificationGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    notificationGateway = new InMemoryNotificationGateway();
    sendEmailWithAssessmentCreationLink =
      new SendEmailsWithAssessmentCreationLink(
        new InMemoryUowPerformer(uow),
        notificationGateway,
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
    timeGateway.setNextDate(new Date("2021-05-15T08:00:00.000Z"));

    // Act
    await sendEmailWithAssessmentCreationLink.execute();

    // Assert
    expectToEqual(notificationGateway.getSentEmails(), [
      {
        kind: "CREATE_IMMERSION_ASSESSMENT",
        recipients: [
          immersionApplicationEndingTomorrow.establishmentTutor.email,
        ],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          agencyAssessmentDocumentLink: undefined,
          agencyLogoUrl: expectedAgency.logoUrl,
          agencyValidatorEmail: expectedAgency.validatorEmails[0],
          beneficiaryFirstName:
            immersionApplicationEndingTomorrow.signatories.beneficiary
              .firstName,
          beneficiaryLastName:
            immersionApplicationEndingTomorrow.signatories.beneficiary.lastName,
          conventionId: immersionApplicationEndingTomorrow.id,
          establishmentTutorName: "Tom Cruise",
          internshipKind: immersionApplicationEndingTomorrow.internshipKind,
          immersionAssessmentCreationLink: `http://fake-magic-link/bilan-immersion/${id}/establishment-tutor/2021-05-15T08:00:00.000Z/establishment@example.com`,
        },
      },
    ]);
    expect(uow.outboxRepository.events).toHaveLength(1);
    expect(uow.outboxRepository.events[0].payload).toMatchObject({
      id,
    });
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
    expect(notificationGateway.getSentEmails()).toHaveLength(0);
    expect(uow.outboxRepository.events).toHaveLength(1);
  });
});

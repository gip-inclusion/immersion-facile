import { ConventionDtoBuilder, ConventionId, Role } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const outboxQueries = uow.outboxQueries;
  const outboxRepository = uow.outboxRepository;
  const conventionRepository = uow.conventionRepository;

  const clock = new CustomClock();
  const emailGateway = new InMemoryEmailGateway();
  const uuidGenerator = new UuidV4Generator();
  const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

  const generateConventionMagicLink = ({
    id,
    targetRoute,
  }: {
    id: ConventionId;
    role: Role;
    targetRoute: string;
    email: string;
  }) => `www.immersion-facile.fr/${targetRoute}?jwt=jwtOfImmersion[${id}]`;

  const sendEmailWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      new InMemoryUowPerformer(uow),
      emailGateway,
      clock,
      generateConventionMagicLink,
      createNewEvent,
    );

  return {
    sendEmailWithAssessmentCreationLink,
    outboxQueries,
    outboxRepository,
    emailGateway,
    conventionRepository,
    clock,
  };
};

describe("SendEmailWithImmersionAssessmentCreationLink", () => {
  it("Sends an email to immersions ending tomorrow", async () => {
    // Prepare
    const {
      sendEmailWithAssessmentCreationLink,
      outboxRepository,
      emailGateway,
      conventionRepository,
      clock,
    } = prepareUseCase();

    clock.setNextDate(new Date("2021-05-15T08:00:00.000Z"));

    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .withId("immersion-ending-tommorow-id")
      .withMentorFirstName("Tom")
      .withMentorLastName("Cruise")
      .validated()
      .build();

    const immersionApplicationEndingYesterday = new ConventionDtoBuilder()
      .withDateEnd("2021-05-14T10:00:00.000Z")
      .validated()
      .build();

    await conventionRepository.save(immersionApplicationEndingTomorrow);
    await conventionRepository.save(immersionApplicationEndingYesterday);

    // Act
    await sendEmailWithAssessmentCreationLink.execute();

    // Assert
    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].type).toBe("CREATE_IMMERSION_ASSESSMENT");
    expect(sentEmails[0].recipients).toEqual([
      immersionApplicationEndingTomorrow.signatories.establishmentRepresentative
        .email,
    ]);

    expect(sentEmails[0].params).toEqual({
      immersionAssessmentCreationLink: `www.immersion-facile.fr/bilan-immersion?jwt=jwtOfImmersion[immersion-ending-tommorow-id]`,
      mentorName: "Tom Cruise",
      beneficiaryFirstName:
        immersionApplicationEndingTomorrow.signatories.beneficiary.firstName,
      beneficiaryLastName:
        immersionApplicationEndingTomorrow.signatories.beneficiary.lastName,
    });
    expect(outboxRepository.events).toHaveLength(1);
    expect(outboxRepository.events[0].payload).toMatchObject({
      id: "immersion-ending-tommorow-id",
    });
  });

  it("Does not send an email to immersions having already received one", async () => {
    // Prepare
    const {
      sendEmailWithAssessmentCreationLink,
      outboxRepository,
      emailGateway,
      conventionRepository,
      clock,
    } = prepareUseCase();

    clock.setNextDate(new Date("2021-05-15T08:00:00.000Z"));

    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .validated()
      .withId("immersion-ending-tommorow-id")
      .build();
    await conventionRepository.save(immersionApplicationEndingTomorrow);
    await outboxRepository.save({
      topic: "EmailWithLinkToCreateAssessmentSent",
      payload: { id: immersionApplicationEndingTomorrow.id },
    } as DomainEvent);

    // Act
    await sendEmailWithAssessmentCreationLink.execute();

    // Assert
    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(0);
    expect(outboxRepository.events).toHaveLength(1);
  });
});

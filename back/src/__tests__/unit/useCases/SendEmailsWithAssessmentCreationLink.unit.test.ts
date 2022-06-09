import { ConventionId } from "shared/src/convention/convention.dto";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxQueries } from "../../../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryConventionQueries } from "../../../adapters/secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";

const prepareUseCase = () => {
  const conventionRepo = new InMemoryConventionRepository();
  const outboxRepo = new InMemoryOutboxRepository();

  const conventionQueries = new InMemoryConventionQueries(
    conventionRepo,
    outboxRepo,
  );
  const outboxQueries = new InMemoryOutboxQueries(outboxRepo);

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

  const useCase = new SendEmailsWithAssessmentCreationLink(
    outboxRepo,
    conventionQueries,
    emailGateway,
    clock,
    generateConventionMagicLink,
    createNewEvent,
  );
  return {
    useCase,
    outboxQueries,
    outboxRepo,
    emailGateway,
    applicationRepo: conventionRepo,
    clock,
  };
};

describe("SendEmailWithImmersionAssessmentCreationLink", () => {
  it("Sends an email to immersions ending tomorrow", async () => {
    // Prepare
    const { useCase, outboxRepo, emailGateway, applicationRepo, clock } =
      prepareUseCase();

    clock.setNextDate(new Date("2021-05-15T08:00:00.000Z"));

    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .withId("immersion-ending-tommorow-id")
      .validated()
      .build();

    const immersionApplicationEndingYesterday = new ConventionDtoBuilder()
      .withDateEnd("2021-05-14T10:00:00.000Z")
      .validated()
      .build();

    await applicationRepo.save(immersionApplicationEndingTomorrow);
    await applicationRepo.save(immersionApplicationEndingYesterday);

    // Act
    await useCase.execute();

    // Assert
    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].type).toBe("CREATE_IMMERSION_ASSESSMENT");
    expect(sentEmails[0].recipients).toEqual([
      immersionApplicationEndingTomorrow.mentorEmail,
    ]);

    expect(sentEmails[0].params).toEqual({
      immersionAssessmentCreationLink: `www.immersion-facile.fr/bilan-immersion?jwt=jwtOfImmersion[immersion-ending-tommorow-id]`,
      mentorName: immersionApplicationEndingTomorrow.mentor,
      beneficiaryFirstName: immersionApplicationEndingTomorrow.firstName,
      beneficiaryLastName: immersionApplicationEndingTomorrow.lastName,
    });
    expect(outboxRepo.events).toHaveLength(1);
    expect(outboxRepo.events[0].payload).toMatchObject({
      id: "immersion-ending-tommorow-id",
    });
  });
  it("Does not send an email to immersions having already received one", async () => {
    // Prepare
    const { useCase, outboxRepo, emailGateway, applicationRepo, clock } =
      prepareUseCase();

    clock.setNextDate(new Date("2021-05-15T08:00:00.000Z"));

    const immersionApplicationEndingTomorrow = new ConventionDtoBuilder()
      .withDateEnd("2021-05-16T10:00:00.000Z")
      .validated()
      .withId("immersion-ending-tommorow-id")
      .build();
    await applicationRepo.save(immersionApplicationEndingTomorrow);
    await outboxRepo.save({
      topic: "EmailWithLinkToCreateAssessmentSent",
      payload: { id: immersionApplicationEndingTomorrow.id },
    } as DomainEvent);

    // Act
    await useCase.execute();

    // Assert
    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(0);
    expect(outboxRepo.events).toHaveLength(1);
  });
});

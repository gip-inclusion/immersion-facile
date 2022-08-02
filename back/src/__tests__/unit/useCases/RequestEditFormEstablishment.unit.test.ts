import { TemplatedEmail } from "shared/src/email/email";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { EstablishmentAggregateRepository } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { RequestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/RequestEditFormEstablishment";

const siret = "12345678912345";
const contactEmail = "jerome@gmail.com";
const copyEmails = ["copy@gmail.com"];
const setMethodGetContactEmailFromSiret = (
  establishmentAggregateRepo: EstablishmentAggregateRepository,
) => {
  establishmentAggregateRepo.getEstablishmentAggregateBySiret =
    //eslint-disable-next-line @typescript-eslint/require-await
    async (_siret: string) =>
      new EstablishmentAggregateBuilder()
        .withContact(
          new ContactEntityV2Builder()
            .withEmail(contactEmail)
            .withCopyEmails(copyEmails)
            .build(),
        )
        .build();
};

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const outboxRepository = uow.outboxRepository;
  const outboxQueries = uow.outboxQueries;
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;

  setMethodGetContactEmailFromSiret(establishmentAggregateRepository); // In most of the tests, we need the contact to be defined

  const clock = new CustomClock();
  const emailGateway = new InMemoryEmailGateway();
  const uuidGenerator = new UuidV4Generator();
  const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

  const uowPerformer = new InMemoryUowPerformer(uow);

  const generateEditFormEstablishmentUrl = (payload: EstablishmentJwtPayload) =>
    `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${payload.siret}]`;

  const useCase = new RequestEditFormEstablishment(
    uowPerformer,
    emailGateway,
    clock,
    generateEditFormEstablishmentUrl,
    createNewEvent,
  );
  return {
    useCase,
    outboxQueries,
    outboxRepository,
    establishmentAggregateRepository,
    emailGateway,
    clock,
  };
};

describe("RequestUpdateFormEstablishment", () => {
  it("Throws an error if contact email is unknown", async () => {
    // Prepare
    const { useCase, establishmentAggregateRepository } = prepareUseCase();

    establishmentAggregateRepository.getEstablishmentAggregateBySiret =
      //eslint-disable-next-line @typescript-eslint/require-await
      async (_siret: string) =>
        new EstablishmentAggregateBuilder().withoutContact().build();

    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(siret),
      Error("Email du contact introuvable."),
    );
  });

  describe("If no email has been sent yet.", () => {
    it("Sends an email to the contact of the establishment with eventually email in CC", async () => {
      // Prepare
      const { useCase, emailGateway } = prepareUseCase();

      // Act
      await useCase.execute(siret);

      // Assert
      const actualSentEmails = emailGateway.getSentEmails();
      expect(actualSentEmails).toHaveLength(1);
      const expectedEmail: TemplatedEmail = {
        type: "EDIT_FORM_ESTABLISHMENT_LINK",
        recipients: [contactEmail],
        cc: copyEmails,
        params: {
          editFrontUrl: `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${siret}]`,
        },
      };
      expect(actualSentEmails[0]).toEqual(expectedEmail);
    });
    it("Saves an event in outbox repo", async () => {
      // Prepare
      const { useCase, outboxRepository } = prepareUseCase();

      // Act
      await useCase.execute(siret);

      // Assert
      expect(outboxRepository.events).toHaveLength(1);
      expect(outboxRepository.events[0]).toMatchObject({
        topic: "FormEstablishmentEditLinkSent",
        payload: { siret },
      });
    });
  });
  describe("If an email has already been sent for this establishment.", () => {
    it("Throws an error if an email has already been sent to this contact and the edit link is still valid", async () => {
      // Prepare
      const { useCase, outboxQueries, clock } = prepareUseCase();

      outboxQueries.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret =
        //eslint-disable-next-line @typescript-eslint/require-await
        async (siret: string) => ({
          siret,
          iat: new Date("2021-01-01T12:00:00.000").getTime(),
          exp: new Date("2021-01-02T12:00:00.000").getTime(),
          version: 1,
        });

      clock.setNextDate(new Date("2021-01-01T13:00:00.000")); // The last email's link for this siret has not expired

      // Act and assert
      await expectPromiseToFailWithError(
        useCase.execute(siret),
        new BadRequestError(
          "Un email a déjà été envoyé au contact référent de l'établissement le 01/01/2021",
        ),
      );
    });
  });

  it("Sends a new email if the edit link in last email has expired", async () => {
    // Prepare
    const { useCase, outboxRepository, outboxQueries, emailGateway, clock } =
      prepareUseCase();

    outboxQueries.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret =
      //eslint-disable-next-line @typescript-eslint/require-await
      async (siret: string) => ({
        siret,
        iat: new Date("2021-01-01T12:00:00.000").getTime(),
        exp: new Date("2021-01-02T12:00:00.000").getTime(),
        version: 1,
      });
    clock.setNextDate(new Date("2021-01-02T13:00:00.000")); // 1 hour after the link of the last email for this siret has expired

    // Act
    await useCase.execute(siret);

    // Assert
    expect(emailGateway.getSentEmails()).toHaveLength(1);
    expect(outboxRepository.events).toHaveLength(1);
  });
});

import { createInMemoryUow } from "../../../adapters/primary/config";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersionOfferRepository";
import {
  InMemoryEmailGateway,
  TemplatedEmail,
} from "../../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { ImmersionOfferRepository } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { RequestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/RequestEditFormEstablishment";
import { EditFormEstablishmentPayload } from "../../../shared/tokens/MagicLinkPayload";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

const siret = "12345678912345";
const contactEmail = "jerome@gmail.com";
const setMethodGetContactEmailFromSiret = (
  immersionOfferRepo: ImmersionOfferRepository,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  immersionOfferRepo.getContactEmailFromSiret = async (siret: string) =>
    contactEmail;
};

const prepareUseCase = () => {
  const outboxRepo = new InMemoryOutboxRepository();
  const immersionOfferRepo = new InMemoryImmersionOfferRepository();
  setMethodGetContactEmailFromSiret(immersionOfferRepo); // In most of the tests, we need the contact to be defined

  const clock = new CustomClock();
  const emailGateway = new InMemoryEmailGateway();
  const uuidGenerator = new UuidV4Generator();
  const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    immersionOfferRepo,
    outboxRepo,
  });

  const generateEditFormEstablishmentUrl = (
    payload: EditFormEstablishmentPayload,
  ) => `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${payload.siret}]`;

  const useCase = new RequestEditFormEstablishment(
    uowPerformer,
    emailGateway,
    clock,
    generateEditFormEstablishmentUrl,
    createNewEvent,
  );
  return { useCase, outboxRepo, immersionOfferRepo, emailGateway, clock };
};

describe("RequestUpdateFormEstablishment", () => {
  it("Throws an error if contact email is unknown", async () => {
    // Prepare
    const { useCase, immersionOfferRepo } = prepareUseCase();
    immersionOfferRepo.getContactEmailFromSiret = async (
      siret: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    ) => undefined;

    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(siret),
      Error("Email du contact introuvable."),
    );
  });

  describe("If no email has been sent yet.", () => {
    it("Sends an email to the contact of the establishment ", async () => {
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
        params: {
          editFrontUrl: `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${siret}]`,
        },
      };
      expect(actualSentEmails[0]).toEqual(expectedEmail);
    });
    it("Saves an event in outbox repo", async () => {
      // Prepare
      const { useCase, outboxRepo } = prepareUseCase();

      // Act
      await useCase.execute(siret);

      // Assert
      expect(outboxRepo.events).toHaveLength(1);
      expect(outboxRepo.events[0]).toMatchObject({
        topic: "FormEstablishmentEditLinkSent",
        payload: { siret: siret },
      });
    });
  });
  describe("If an email has already been sent for this establishment.", () => {
    it("Throws an error if an email has already been sent to this contact and the edit link is still valid", async () => {
      // Prepare
      const { useCase, outboxRepo, clock } = prepareUseCase();
      outboxRepo.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret =
        async (
          siret: string, // eslint-disable-line @typescript-eslint/no-unused-vars
        ) => ({
          siret,
          issuedAt: new Date("2021-01-01T12:00:00.000").getTime(),
          expiredAt: new Date("2021-01-02T12:00:00.000").getTime(),
        });
      clock.setNextDate(new Date("2021-01-01T13:00:00.000")); // The last email's link for this siret has not expired

      // Act and assert
      await expectPromiseToFailWithError(
        useCase.execute(siret),
        Error(
          "Un email a déjà été envoyé au contact référent de l'établissement le 01/01/2021",
        ),
      );
    });
  });
  it("Sends a new email if the edit link in last email has expired", async () => {
    // Prepare
    const { useCase, outboxRepo, emailGateway, clock } = prepareUseCase();

    outboxRepo.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret = async (
      siret: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    ) => ({
      siret,
      issuedAt: new Date("2021-01-01T12:00:00.000").getTime(),
      expiredAt: new Date("2021-01-02T12:00:00.000").getTime(),
    });
    clock.setNextDate(new Date("2021-01-02T13:00:00.000")); // 1 hour after the link of the last email for this siret has expired

    // Act
    await useCase.execute(siret);

    // Assert
    expect(emailGateway.getSentEmails()).toHaveLength(1);
    expect(outboxRepo.events).toHaveLength(1);
  });
});

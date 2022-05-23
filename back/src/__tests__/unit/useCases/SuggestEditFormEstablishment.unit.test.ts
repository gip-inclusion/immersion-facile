import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxQueries } from "../../../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { EstablishmentAggregateRepository } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { SuggestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/SuggestEditFormEstablishment";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";

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
  const outboxRepo = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepo);
  const establishmentAggregateRepo =
    new InMemoryEstablishmentAggregateRepository();
  setMethodGetContactEmailFromSiret(establishmentAggregateRepo); // In most of the tests, we need the contact to be defined

  const clock = new CustomClock();
  const emailGateway = new InMemoryEmailGateway();
  const uuidGenerator = new UuidV4Generator();
  const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    establishmentAggregateRepo,
    outboxRepo,
    outboxQueries,
  });

  const generateEditFormEstablishmentUrl = (payload: EstablishmentJwtPayload) =>
    `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${payload.siret}]`;

  const useCase = new SuggestEditFormEstablishment(
    uowPerformer,
    emailGateway,
    clock,
    generateEditFormEstablishmentUrl,
    createNewEvent,
  );
  return {
    useCase,
    outboxQueries,
    outboxRepo,
    establishmentAggregateRepo,
    emailGateway,
  };
};

describe("SuggestEditFormEstablishment", () => {
  it("Throws an error if contact email is unknown", async () => {
    // Prepare
    const { useCase, establishmentAggregateRepo } = prepareUseCase();

    establishmentAggregateRepo.getEstablishmentAggregateBySiret =
      //eslint-disable-next-line @typescript-eslint/require-await
      async (_siret: string) =>
        new EstablishmentAggregateBuilder().withoutContact().build();

    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(siret),
      Error("Email du contact introuvable."),
    );
  });

  it("Sends an email to contact and people in copy", async () => {
    // Prepare
    const { useCase, outboxRepo, outboxQueries, emailGateway } =
      prepareUseCase();

    outboxQueries.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret =
      // eslint-disable-next-line @typescript-eslint/require-await
      async (siret: string) => ({
        siret,
        iat: new Date("2021-01-01T12:00:00.000").getTime(),
        exp: new Date("2021-01-02T12:00:00.000").getTime(),
        version: 1,
      });

    // Act
    await useCase.execute(siret);

    // Assert
    const sentEmails = emailGateway.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].type).toBe("SUGGEST_EDIT_FORM_ESTABLISHMENT");
    expect(outboxRepo.events).toHaveLength(1);
  });
});

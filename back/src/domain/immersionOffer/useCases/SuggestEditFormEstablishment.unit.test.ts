import { EstablishmentJwtPayload, expectPromiseToFailWithError } from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import { SuggestEditFormEstablishment } from "./SuggestEditFormEstablishment";

const siret = "12345678912345";
const contactEmail = "jerome@gmail.com";
const copyEmails = ["copy@gmail.com"];
const setMethodGetContactEmailFromSiret = (
  establishmentAggregateRepository: EstablishmentAggregateRepository,
) => {
  establishmentAggregateRepository.getEstablishmentAggregateBySiret =
    //eslint-disable-next-line @typescript-eslint/require-await
    async (_siret: string) =>
      new EstablishmentAggregateBuilder()
        .withContact(
          new ContactEntityBuilder()
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

  const timeGateway = new CustomTimeGateway();
  const notificationGateway = new InMemoryNotificationGateway(timeGateway);
  const uuidGenerator = new UuidV4Generator();
  const createNewEvent = makeCreateNewEvent({
    timeGateway,
    uuidGenerator,
  });

  const uowPerformer = new InMemoryUowPerformer(uow);

  const generateEditFormEstablishmentUrl = (payload: EstablishmentJwtPayload) =>
    `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${payload.siret}]`;

  const useCase = new SuggestEditFormEstablishment(
    uowPerformer,
    notificationGateway,
    timeGateway,
    generateEditFormEstablishmentUrl,
    createNewEvent,
  );
  return {
    useCase,
    outboxQueries,
    outboxRepository,
    establishmentAggregateRepository,
    notificationGateway,
  };
};

describe("SuggestEditFormEstablishment", () => {
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

  it("Sends an email to contact and people in copy", async () => {
    // Prepare
    const { useCase, outboxRepository, outboxQueries, notificationGateway } =
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
    const sentEmails = notificationGateway.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].kind).toBe("SUGGEST_EDIT_FORM_ESTABLISHMENT");
    expect(outboxRepository.events).toHaveLength(1);
  });
});

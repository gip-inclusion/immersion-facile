import { AppConfig } from "../../adapters/primary/appConfig";
import { makeGenerateEditFormEstablishmentUrl } from "../../adapters/primary/config";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { CreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { OutboxQueries } from "../../domain/core/ports/OutboxQueries";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { UnitOfWork } from "../../domain/core/ports/UnitOfWork";
import { ContactEntityV2 } from "../../domain/immersionOffer/entities/ContactEntity";
import { EstablishmentAggregateRepository } from "../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { RequestEditFormEstablishment } from "../../domain/immersionOffer/useCases/RequestEditFormEstablishment";

// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

describe("RequestEditFormEstablishment", () => {
  // eslint-disable-next-line jest/expect-expect
  it("Sends an email to the establishment contact email when requesting edit link", async () => {
    //Arrange deps
    const config = AppConfig.createFromEnv();
    const clock = new RealClock();

    const testContact: ContactEntityV2 = {
      id: "iamanid",
      email: "romain.cambonie@beta.gouv.fr",
      firstName: "Esteban",
      lastName: "Ocon",
      phone: "+33012345678",
      job: "a job",
      contactMethod: "EMAIL",
      copyEmails: undefined,
    } as unknown as ContactEntityV2;

    const unitOfWork = {
      establishmentAggregateRepo: {
        getContactForEstablishmentSiret: (): ContactEntityV2 => testContact,
      } as unknown as EstablishmentAggregateRepository,
      outboxQueries: {
        getLastPayloadOfFormEstablishmentEditLinkSentWithSiret: (): undefined =>
          undefined,
      } as unknown as OutboxQueries,
      outboxRepo: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        save: () => {},
      } as unknown as OutboxRepository,
    } as UnitOfWork;

    const uowPerformer = new InMemoryUowPerformer(unitOfWork);

    const SIRET = "12345678901234";

    const emailGateway: SendinblueEmailGateway = SendinblueEmailGateway.create(
      config.sendinblueApiKey,
    );
    const generateEditFormEstablishmentUrl =
      makeGenerateEditFormEstablishmentUrl(config);

    const requestEditFormEstablishmentUsecase =
      new RequestEditFormEstablishment(
        uowPerformer,
        emailGateway,
        clock,
        generateEditFormEstablishmentUrl,
        (() => {}) as unknown as CreateNewEvent,
      );

    //Act
    await requestEditFormEstablishmentUsecase.execute(SIRET);
  });
});

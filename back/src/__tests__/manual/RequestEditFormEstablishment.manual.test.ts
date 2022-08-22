import axios from "axios";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { makeGenerateEditFormEstablishmentUrl } from "../../adapters/primary/config/makeGenerateEditFormEstablishmentUrl";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { SendinblueEmailGateway } from "../../adapters/secondary/emailGateway/SendinblueEmailGateway";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import { CreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { OutboxQueries } from "../../domain/core/ports/OutboxQueries";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { UnitOfWork } from "../../domain/core/ports/UnitOfWork";
import { ContactEntityV2 } from "../../domain/immersionOffer/entities/ContactEntity";
import { EstablishmentAggregateRepository } from "../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { RequestEditFormEstablishment } from "../../domain/immersionOffer/useCases/RequestEditFormEstablishment";

// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const SIRET = "12345678901234";
const RECIPIENT_ADDRESS = "romain.cambonie@beta.gouv.fr";
const BASE_BUSINESS_CONTACT: Omit<ContactEntityV2, "copyEmails"> = {
  id: "iamanid",
  email: RECIPIENT_ADDRESS,
  firstName: "Esteban",
  lastName: "Ocon",
  phone: "+33012345678",
  job: "a job",
  contactMethod: "EMAIL",
};

describe("RequestEditFormEstablishment", () => {
  const useCaseFromMinimalConfig = (
    businessContact: ContactEntityV2,
  ): RequestEditFormEstablishment => {
    const config = AppConfig.createFromEnv();
    const clock = new RealClock();

    const unitOfWork = {
      establishmentAggregateRepository: {
        getContactForEstablishmentSiret: (): ContactEntityV2 => businessContact,
      } as unknown as EstablishmentAggregateRepository,
      outboxQueries: {
        getLastPayloadOfFormEstablishmentEditLinkSentWithSiret: (): undefined =>
          undefined,
      } as unknown as OutboxQueries,
      outboxRepository: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        save: () => {},
      } as unknown as OutboxRepository,
    } as UnitOfWork;

    const uowPerformer = new InMemoryUowPerformer(unitOfWork);
    const emailGateway = new SendinblueEmailGateway(
      axios,
      (_) => true,
      config.sendinblueApiKey,
    );
    const generateEditFormEstablishmentUrl =
      makeGenerateEditFormEstablishmentUrl(config);

    return new RequestEditFormEstablishment(
      uowPerformer,
      emailGateway,
      clock,
      generateEditFormEstablishmentUrl,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (() => {}) as unknown as CreateNewEvent,
    );
  };

  // eslint-disable-next-line jest/expect-expect
  it("Requesting an edit link should work even if copyEmails are undefined or an empty array", async () => {
    //Arrange deps
    const contactWithEmptyCopyEmails: ContactEntityV2 = {
      ...BASE_BUSINESS_CONTACT,
      copyEmails: [],
    };

    const useCase: RequestEditFormEstablishment = useCaseFromMinimalConfig(
      contactWithEmptyCopyEmails,
    );

    // Act
    await useCase.execute(SIRET);

    //Expect
    // The mail should be visible as 'Sent' in https://app-smtp.sendinblue.com/log
  });
});

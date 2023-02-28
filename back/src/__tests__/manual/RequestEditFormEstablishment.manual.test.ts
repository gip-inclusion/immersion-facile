import axios from "axios";
import { immersionFacileContactEmail } from "shared";
import {
  AppConfig,
  makeEmailAllowListPredicate,
} from "../../adapters/primary/config/appConfig";
import { makeGenerateEditFormEstablishmentUrl } from "../../adapters/primary/config/makeGenerateEditFormEstablishmentUrl";
import { RealTimeGateway } from "../../adapters/secondary/core/TimeGateway/RealTimeGateway";
import { SendinblueHtmlEmailGateway } from "../../adapters/secondary/emailGateway/SendinblueHtmlEmailGateway";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import { CreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { OutboxQueries } from "../../domain/core/ports/OutboxQueries";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { UnitOfWork } from "../../domain/core/ports/UnitOfWork";
import { ContactEntity } from "../../domain/immersionOffer/entities/ContactEntity";
import { EstablishmentAggregateRepository } from "../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { RequestEditFormEstablishment } from "../../domain/immersionOffer/useCases/RequestEditFormEstablishment";

// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const SIRET = "12345678901234";
const RECIPIENT_ADDRESS = "romain.cambonie@beta.gouv.fr";
const BASE_BUSINESS_CONTACT: Omit<ContactEntity, "copyEmails"> = {
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
    businessContact: ContactEntity,
  ): RequestEditFormEstablishment => {
    const config = AppConfig.createFromEnv();
    const timeGateway = new RealTimeGateway();

    const unitOfWork = {
      establishmentAggregateRepository: {
        getContactForEstablishmentSiret: (): ContactEntity => businessContact,
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
    const emailGateway = new SendinblueHtmlEmailGateway(
      axios,
      makeEmailAllowListPredicate({
        skipEmailAllowList: config.skipEmailAllowlist,
        emailAllowList: config.emailAllowList,
      }),
      config.apiKeySendinblue,
      {
        name: "Immersion Facilitée",
        email: immersionFacileContactEmail,
      },
    );
    const generateEditFormEstablishmentUrl =
      makeGenerateEditFormEstablishmentUrl(config);

    return new RequestEditFormEstablishment(
      uowPerformer,
      emailGateway,
      timeGateway,
      generateEditFormEstablishmentUrl,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (() => {}) as unknown as CreateNewEvent,
    );
  };

  // eslint-disable-next-line jest/expect-expect
  it("Requesting an edit link should work even if copyEmails are undefined or an empty array", async () => {
    //Arrange deps
    const contactWithEmptyCopyEmails: ContactEntity = {
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

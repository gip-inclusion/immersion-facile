import { AppConfig } from "../../adapters/primary/appConfig";
import {
  createGenerateMagicLinkFn,
  GenerateMagicLinkFn,
} from "../../adapters/primary/config";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyNewApplicationNeedsReview } from "../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ImmersionApplicationDto } from "../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";

const validDemandeImmersion: ImmersionApplicationDto =
  new ImmersionApplicationDtoBuilder()
    .withEmail("jean-francois.macresy@beta.gouv.fr")
    .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
    .build();

describe("Notify To 2 Counsellors that an application is available ", () => {
  let emailGw: SendinblueEmailGateway;
  let generateMagicLinkFn: GenerateMagicLinkFn;
  let agencyConfig;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    emailGw = SendinblueEmailGateway.create(config.sendinblueApiKey);
    generateMagicLinkFn = createGenerateMagicLinkFn(config);
  });

  test.skip("Sends notification mails to check Immersion Application eligibility", async () => {
    const counsellorEmails = [
      "jeanfrancois.macresy@gmail.com",
      "jeanfrancois.macresy+beneficiary@gmail.com",
    ];

    agencyConfig = AgencyConfigBuilder.create(validDemandeImmersion.agencyCode)
      .withCounsellorEmails(counsellorEmails)
      .build();
    const inMemoryAgencyRepository = new InMemoryAgencyRepository({
      [agencyConfig.id]: agencyConfig,
    });
    const notifyNewApplicationNeedsReview = new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      generateMagicLinkFn,
    );
    await notifyNewApplicationNeedsReview.execute(validDemandeImmersion);
  });

  test.skip("Sends notification mails to check Immersion Application eligibility with a real working immersion from Airtable", async () => {
    const counsellorEmails = [
      "jeanfrancois.macresy@gmail.com",
      "jean-francois.macresy@beta.gouv.fr",
    ];

    agencyConfig = AgencyConfigBuilder.create(validDemandeImmersion.agencyCode)
      .withCounsellorEmails(counsellorEmails)
      .build();

    validDemandeImmersion.id = "ef725832-c8f9-41e1-974b-44372e6e474c";
    const inMemoryAgencyRepository = new InMemoryAgencyRepository({
      [agencyConfig.id]: agencyConfig,
    });
    const notifyNewApplicationNeedsReview = new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      generateMagicLinkFn,
    );
    await notifyNewApplicationNeedsReview.execute(validDemandeImmersion);
  });

  test.skip("Sends notification mails to check Immersion Application validation  with a real working immersion from Airtable", async () => {
    const validationEmails = [
      "jeanfrancois.macresy@gmail.com",
      "jean-francois.macresy@beta.gouv.fr",
    ];

    agencyConfig = AgencyConfigBuilder.create(validDemandeImmersion.agencyCode)
      .withValidatorEmails(validationEmails)
      .build();
    validDemandeImmersion.id = "ef725832-c8f9-41e1-974b-44372e6e474c";
    const inMemoryAgencyRepository = new InMemoryAgencyRepository({
      [agencyConfig.id]: agencyConfig,
    });
    const notifyNewApplicationNeedsReview = new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      generateMagicLinkFn,
    );
    await notifyNewApplicationNeedsReview.execute(validDemandeImmersion);
  });
});

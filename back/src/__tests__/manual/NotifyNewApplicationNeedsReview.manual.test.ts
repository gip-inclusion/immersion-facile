import { AppConfig } from "../../adapters/primary/appConfig";
import {
  createGenerateVerificationMagicLink,
  GenerateVerificationMagicLink,
} from "../../adapters/primary/config";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyNewApplicationNeedsReview } from "../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";

// These tests are not hermetic and not meant for automated testing. They will send emails using
// sendinblue, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const validImmersionApplication: ImmersionApplicationDto =
  new ImmersionApplicationDtoBuilder()
    .withEmail("jean-francois.macresy@beta.gouv.fr")
    .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
    .build();

describe("Notify To 2 Counsellors that an application is available", () => {
  let emailGw: SendinblueEmailGateway;
  let generateMagicLinkFn: GenerateVerificationMagicLink;
  let agencyConfig;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    emailGw = SendinblueEmailGateway.create(config.sendinblueApiKey);
    generateMagicLinkFn = createGenerateVerificationMagicLink(config);
  });

  //eslint-disable-next-line jest/expect-expect
  it("Sends notification mails to check Immersion Application eligibility", async () => {
    const counsellorEmails = [
      "jeanfrancois.macresy@gmail.com",
      "jeanfrancois.macresy+beneficiary@gmail.com",
    ];

    agencyConfig = AgencyConfigBuilder.create(
      validImmersionApplication.agencyId,
    )
      .withCounsellorEmails(counsellorEmails)
      .build();
    const inMemoryAgencyRepository = new InMemoryAgencyRepository([
      agencyConfig,
    ]);
    const notifyNewApplicationNeedsReview = new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      generateMagicLinkFn,
    );
    await notifyNewApplicationNeedsReview.execute(validImmersionApplication);
  });

  // TODO(jfmac)
  // Needs to be re-done with real db
  //eslint-disable-next-line jest/expect-expect
  it("Sends notification mails to check Immersion Application eligibility with a real working immersion", async () => {
    const counsellorEmails = [
      "jeanfrancois.macresy@gmail.com",
      "jean-francois.macresy@beta.gouv.fr",
    ];

    agencyConfig = AgencyConfigBuilder.create(
      validImmersionApplication.agencyId,
    )
      .withCounsellorEmails(counsellorEmails)
      .build();

    validImmersionApplication.id = "ef725832-c8f9-41e1-974b-44372e6e474c";
    const inMemoryAgencyRepository = new InMemoryAgencyRepository([
      agencyConfig,
    ]);
    const notifyNewApplicationNeedsReview = new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      generateMagicLinkFn,
    );
    await notifyNewApplicationNeedsReview.execute(validImmersionApplication);
  });

  //eslint-disable-next-line jest/no-conditional-expect, jest/expect-expect
  it("Sends notification mails to check Immersion Application validation  with a real working immersion", async () => {
    const validationEmails = [
      "jeanfrancois.macresy@gmail.com",
      "jean-francois.macresy@beta.gouv.fr",
    ];

    agencyConfig = AgencyConfigBuilder.create(
      validImmersionApplication.agencyId,
    )
      .withValidatorEmails(validationEmails)
      .build();
    validImmersionApplication.id = "ef725832-c8f9-41e1-974b-44372e6e474c";
    const inMemoryAgencyRepository = new InMemoryAgencyRepository([
      agencyConfig,
    ]);
    const notifyNewApplicationNeedsReview = new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      generateMagicLinkFn,
    );
    await notifyNewApplicationNeedsReview.execute(validImmersionApplication);
  });
});

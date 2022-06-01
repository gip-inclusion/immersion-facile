import { AppConfig } from "../../adapters/primary/config/appConfig";
import { createGenerateVerificationMagicLink } from "../../adapters/primary/config/createGenerateVerificationMagicLink";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";

// These tests are not hermetic and not meant for automated testing. They will send emails using
// sendinblue, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const validImmersionApplication = new ImmersionApplicationDtoBuilder()
  .withEmail("jean-francois.macresy@beta.gouv.fr")
  .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
  .build();

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: SendinblueEmailGateway;
  let notifyToTeamApplicationSubmittedByBeneficiary: NotifyToTeamApplicationSubmittedByBeneficiary;
  let agencyRepo: InMemoryAgencyRepository;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    emailGw = SendinblueEmailGateway.create(config.sendinblueApiKey);
    notifyToTeamApplicationSubmittedByBeneficiary =
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        emailGw,
        agencyRepo,
        createGenerateVerificationMagicLink(config),
      );
  });

  // eslint-disable-next-line jest/expect-expect
  it("Sends no emails when allowList and unrestrictedEmailSendingAgencies is empty", async () => {
    validImmersionApplication.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validImmersionApplication.email =
      "jeanfrancois.macresy+beneficiary@gmail.com";

    await notifyToTeamApplicationSubmittedByBeneficiary.execute(
      validImmersionApplication,
    );
  });
});

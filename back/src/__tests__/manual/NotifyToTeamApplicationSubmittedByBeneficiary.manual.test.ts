import { AppConfig } from "../../adapters/primary/config/appConfig";
import { createGenerateConventionMagicLink } from "../../adapters/primary/config/createGenerateConventionMagicLink";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/convention/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";

// These tests are not hermetic and not meant for automated testing. They will send emails using
// sendinblue, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const validConvention = new ConventionDtoBuilder()
  .withEmail("jean-francois.macresy@beta.gouv.fr")
  .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
  .build();

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: SendinblueEmailGateway;
  let notifyToTeamApplicationSubmittedByBeneficiary: NotifyToTeamApplicationSubmittedByBeneficiary;
  let agencyRepo: InMemoryAgencyRepository;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    emailGw = SendinblueEmailGateway.create(
      config.sendinblueApiKey,
      (_) => true,
    );
    notifyToTeamApplicationSubmittedByBeneficiary =
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        emailGw,
        agencyRepo,
        createGenerateConventionMagicLink(config),
      );
  });

  // eslint-disable-next-line jest/expect-expect
  it("Sends no emails when allowList and unrestrictedEmailSendingAgencies is empty", async () => {
    validConvention.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validConvention.email = "jeanfrancois.macresy+beneficiary@gmail.com";

    await notifyToTeamApplicationSubmittedByBeneficiary.execute(
      validConvention,
    );
  });
});

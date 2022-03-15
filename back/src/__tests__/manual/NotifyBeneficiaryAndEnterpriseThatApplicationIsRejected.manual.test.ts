import { AppConfig } from "../../adapters/primary/appConfig";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { AgencyRepository } from "../../domain/immersionApplication/ports/AgencyRepository";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { AllowListEmailFilter } from "../../adapters/secondary/core/EmailFilterImplementations";

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
const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyApplicationRejectedToBeneficiaryAndEnterprise", () => {
  let emailGw: SendinblueEmailGateway;
  let agencyRepository: AgencyRepository;
  let notifyBeneficiaryAndEnterpriseThatApplicationIsRejected: NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected;
  const rejectionJustification = "Risque d'emploi de main d'oeuvre gratuite";

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    emailGw = SendinblueEmailGateway.create(config.sendinblueApiKey);
    agencyRepository = new InMemoryAgencyRepository([
      AgencyConfigBuilder.create(validImmersionApplication.agencyId)
        .withCounsellorEmails([counsellorEmail])
        .build(),
    ]);
    validImmersionApplication.status = "REJECTED";
    validImmersionApplication.rejectionJustification = rejectionJustification;
  });

  //eslint-disable-next-line jest/expect-expect
  it("Sends rejection email", async () => {
    validImmersionApplication.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validImmersionApplication.email =
      "jeanfrancois.macresy+beneficiary@gmail.com";

    const emailFilter = new AllowListEmailFilter([
      validImmersionApplication.mentorEmail,
      validImmersionApplication.email,
      counsellorEmail,
    ]);

    notifyBeneficiaryAndEnterpriseThatApplicationIsRejected =
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailFilter,
        emailGw,
        agencyRepository,
      );

    await notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      validImmersionApplication,
    );
  });
});

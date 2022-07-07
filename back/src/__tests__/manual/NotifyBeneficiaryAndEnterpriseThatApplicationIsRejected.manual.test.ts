import { AppConfig } from "../../adapters/primary/config/appConfig";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { AgencyRepository } from "../../domain/convention/ports/AgencyRepository";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { AllowListEmailFilter } from "../../adapters/secondary/core/EmailFilterImplementations";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";

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
const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyApplicationRejectedToBeneficiaryAndEnterprise", () => {
  let emailGw: SendinblueEmailGateway;
  let agencyRepository: AgencyRepository;
  let notifyBeneficiaryAndEnterpriseThatApplicationIsRejected: NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected;
  const rejectionJustification = "Risque d'emploi de main d'oeuvre gratuite";

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    const clock = new CustomClock();
    emailGw = SendinblueEmailGateway.create(
      config.sendinblueApiKey,
      (_) => true,
      clock,
    );
    agencyRepository = new InMemoryAgencyRepository([
      AgencyDtoBuilder.create(validConvention.agencyId)
        .withCounsellorEmails([counsellorEmail])
        .build(),
    ]);
    validConvention.status = "REJECTED";
    validConvention.rejectionJustification = rejectionJustification;
  });

  //eslint-disable-next-line jest/expect-expect
  it("Sends rejection email", async () => {
    validConvention.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validConvention.email = "jeanfrancois.macresy+beneficiary@gmail.com";

    const emailFilter = new AllowListEmailFilter([
      validConvention.mentorEmail,
      validConvention.email,
      counsellorEmail,
    ]);

    notifyBeneficiaryAndEnterpriseThatApplicationIsRejected =
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailFilter,
        emailGw,
        agencyRepository,
      );

    await notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      validConvention,
    );
  });
});

import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { SendinblueEmailGateway } from "../../adapters/secondary/emailGateway/SendinblueEmailGateway";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { AgencyRepository } from "../../domain/convention/ports/AgencyRepository";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";

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
    emailGw = SendinblueEmailGateway.create(
      config.sendinblueApiKey,
      (_) => true,
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

    notifyBeneficiaryAndEnterpriseThatApplicationIsRejected =
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailGw,
        agencyRepository,
      );

    await notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      validConvention,
    );
  });
});

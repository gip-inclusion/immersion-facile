import axios from "axios";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { createInMemoryUow } from "../../adapters/primary/config/uowConfig";
import { SendinblueEmailGateway } from "../../adapters/secondary/emailGateway/SendinblueEmailGateway";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";

// These tests are not hermetic and not meant for automated testing. They will send emails using
// sendinblue, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const rejectionJustification = "Risque d'emploi de main d'oeuvre gratuite";

const rejectedConvention = new ConventionDtoBuilder()
  .withStatus("REJECTED")
  .withRejectionJustification(rejectionJustification)
  .withMentorEmail("recette+test-mentor@immersion-facile.beta.gouv.fr")
  .withEmail("recette+test-beneficiary@immersion-facile.beta.gouv.fr")
  .build();

const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyApplicationRejectedToBeneficiaryAndEnterprise", () => {
  it("Sends rejection email", async () => {
    const config = AppConfig.createFromEnv();
    const emailGw = new SendinblueEmailGateway(
      axios,
      (_) => true,
      config.apiKeySendinblue,
    );
    const uow = createInMemoryUow();
    uow.agencyRepository.setAgencies([
      AgencyDtoBuilder.create(rejectedConvention.agencyId)
        .withCounsellorEmails([counsellorEmail])
        .build(),
    ]);

    const notifyBeneficiaryAndEnterpriseThatApplicationIsRejected =
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        new InMemoryUowPerformer(uow),
        emailGw,
      );

    await notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      rejectedConvention,
    );

    // eslint-disable-next-line no-console
    console.log("-> Please check email has reached destination");
    expect(true).toBeTruthy();
  });
});

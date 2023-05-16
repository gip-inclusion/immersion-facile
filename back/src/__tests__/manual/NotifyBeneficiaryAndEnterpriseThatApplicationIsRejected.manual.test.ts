import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  immersionFacileContactEmail,
} from "shared";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../adapters/primary/config/createHttpClientForExternalApi";
import { createInMemoryUow } from "../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import { SendinblueHtmlNotificationGateway } from "../../adapters/secondary/notificationGateway/SendinblueHtmlNotificationGateway";
import { sendinblueHtmlNotificationGatewayTargets } from "../../adapters/secondary/notificationGateway/SendinblueHtmlNotificationGateway.targets";
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
  .withStatusJustification(rejectionJustification)
  .withEstablishmentTutorEmail(
    "recette+test-establishmentTutor@immersion-facile.beta.gouv.fr",
  )
  .withBeneficiaryEmail(
    "recette+test-beneficiary@immersion-facile.beta.gouv.fr",
  )
  .build();

const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyApplicationRejectedToBeneficiaryAndEnterprise", () => {
  it("Sends rejection email", async () => {
    const config = AppConfig.createFromEnv();
    const notificationGateway = new SendinblueHtmlNotificationGateway(
      configureCreateHttpClientForExternalApi()(
        sendinblueHtmlNotificationGatewayTargets,
      ),
      (_) => true,
      config.apiKeySendinblue,
      {
        name: "Immersion Facilitée",
        email: immersionFacileContactEmail,
      },
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
        notificationGateway,
      );

    await notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      rejectedConvention,
    );

    // eslint-disable-next-line no-console
    console.log("-> Please check email has reached destination");
    expect(true).toBeTruthy();
  });
});

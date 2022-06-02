import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { frontRoutes } from "shared/src/routes";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(application: ImmersionApplicationDto): Promise<void> {
    if (application.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring beneficiary confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, email, firstName, lastName, businessName } = application;

    logger.info(
      { immersionApplicationId: id },
      `------------- Entering execute`,
    );

    await this.emailFilter.withAllowedRecipients(
      [email],
      ([email]) =>
        this.emailGateway.sendBeneficiarySignatureRequestNotification(email, {
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
          magicLink: this.generateMagicLinkFn({
            id: application.id,
            role: "beneficiary",
            targetRoute: frontRoutes.immersionApplicationsToSign,
            email,
          }),
          businessName,
        }),
      logger,
    );
  }
}

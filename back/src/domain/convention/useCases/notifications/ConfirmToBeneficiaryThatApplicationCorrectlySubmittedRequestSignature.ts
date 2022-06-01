import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { frontRoutes } from "shared/src/routes";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ConventionDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(application: ConventionDto): Promise<void> {
    if (application.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring beneficiary confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, email, firstName, lastName, businessName } = application;

    logger.info({ ConventionId: id }, `------------- Entering execute`);

    await this.emailFilter.withAllowedRecipients(
      [email],
      ([email]) =>
        this.emailGateway.sendBeneficiarySignatureRequestNotification(email, {
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
          magicLink: this.generateMagicLinkFn({
            id: application.id,
            role: "beneficiary",
            targetRoute: frontRoutes.conventionToSign,
            email,
          }),
          businessName,
        }),
      logger,
    );
  }
}

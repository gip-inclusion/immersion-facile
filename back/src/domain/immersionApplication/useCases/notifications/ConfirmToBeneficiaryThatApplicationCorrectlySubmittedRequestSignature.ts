import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { frontRoutes } from "../../../../shared/routes";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "../../../../shared/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
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
          magicLink: this.generateMagicLinkFn(
            application.id,
            "beneficiary",
            frontRoutes.immersionApplicationsToSign,
            email,
          ),
          businessName,
        }),
      logger,
    );
  }
}

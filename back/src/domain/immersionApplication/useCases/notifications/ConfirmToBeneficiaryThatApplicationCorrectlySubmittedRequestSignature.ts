import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { frontRoutes } from "../../../../shared/routes";
import { FeatureFlags } from "../../../../shared/featureFlags";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(application: ImmersionApplicationDto): Promise<void> {
    if (!this.featureFlags.enableEnterpriseSignature) {
      logger.info(
        `Skipping sending signature-requiring beneficiary confirmation as enableEnterpriseSignature flag is off`,
      );
      return;
    }
    if (application.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring beneficiary confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, email, firstName, lastName, businessName } = application;

    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

    const [allowedBeneficiaryEmail] = this.emailFilter.filter([email], {
      onRejected: (email) =>
        logger.info(
          { id, email },
          "Sending beneficiary confirmation email skipped.",
        ),
    });

    if (allowedBeneficiaryEmail) {
      await this.emailGateway.sendBeneficiarySignatureRequestNotification(
        allowedBeneficiaryEmail,
        {
          beneficiaryFirstName: firstName,
          beneficiaryLastName: lastName,
          magicLink: this.generateMagicLinkFn(
            application.id,
            "beneficiary",
            frontRoutes.immersionApplicationsToSign,
            allowedBeneficiaryEmail,
          ),
          businessName,
        },
      );
    }
  }
}

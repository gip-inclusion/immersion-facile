import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ConventionDto> {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(convention: ConventionDto): Promise<void> {
    if (convention.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring beneficiary confirmation as convention is already partially signed`,
      );
      return;
    }

    const {
      id,
      businessName,
      signatories: { beneficiary },
    } = convention;

    await this.emailGateway.sendEmail({
      type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [beneficiary.email],
      params: {
        beneficiaryFirstName: beneficiary.firstName,
        beneficiaryLastName: beneficiary.lastName,
        magicLink: this.generateMagicLinkFn({
          id,
          role: "beneficiary",
          targetRoute: frontRoutes.conventionToSign,
          email: beneficiary.email,
        }),
        businessName,
      },
    });
  }
}

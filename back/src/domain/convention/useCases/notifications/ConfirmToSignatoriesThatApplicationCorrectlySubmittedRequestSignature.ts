import { values } from "ramda";
import { ConventionDto, conventionSchema, frontRoutes } from "shared";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ConventionDto> {
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
        `Skipping sending signature-requiring establishment representative confirmation as convention is already partially signed`,
      );
      return;
    }

    const { id, businessName } = convention;
    const {
      beneficiary,
      beneficiaryRepresentative,
      establishmentRepresentative,
    } = convention.signatories;

    await Promise.all(
      values(convention.signatories).map((signatory) => {
        if (!signatory) return;
        const magicLinkCommonFields = {
          id,
          role: signatory.role,
          targetRoute: frontRoutes.conventionToSign,
          email: signatory.email,
        };

        return this.emailGateway.sendEmail({
          type: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
          recipients: [signatory.email],
          params: {
            signatoryName: `${signatory.firstName} ${signatory.lastName}`,
            beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
            establishmentRepresentativeName: `${establishmentRepresentative.firstName} ${establishmentRepresentative.lastName}`,
            beneficiaryRepresentativeName:
              beneficiaryRepresentative &&
              `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`,
            magicLink: this.generateMagicLinkFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionToSign,
            }),
            conventionStatusLink: this.generateMagicLinkFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionStatusDashboard,
            }),
            businessName,
          },
        });
      }),
    );
  }
}

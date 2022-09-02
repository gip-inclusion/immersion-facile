import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ConventionDto> {
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
        `Skipping sending signature-requiring mentor confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, businessName } = convention;
    const { mentor, beneficiary } = convention.signatories;

    await this.emailGateway.sendEmail({
      type: "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [mentor.email],
      params: {
        beneficiaryFirstName: beneficiary.firstName,
        beneficiaryLastName: beneficiary.lastName,
        magicLink: this.generateMagicLinkFn({
          id,
          role: "establishment",
          targetRoute: frontRoutes.conventionToSign,
          email: mentor.email,
        }),
        businessName,
        mentorName: `${mentor.firstName} ${mentor.lastName}`,
      },
    });
  }
}

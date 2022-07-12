import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyImmersionApplicationWasSignedByOtherParty extends UseCase<ConventionDto> {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(application: ConventionDto): Promise<void> {
    const recipientRole: Role = application.beneficiaryAccepted
      ? "establishment"
      : "beneficiary";

    const { recipientEmail, existingSignatureName } =
      getMailParamsDependingOnRole(recipientRole, application);

    const magicLink = this.generateMagicLinkFn({
      id: application.id,
      role: recipientRole,
      targetRoute: frontRoutes.conventionToSign,
      email: recipientEmail,
    });

    await this.emailGateway.sendEmail({
      type: "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
      recipients: [recipientEmail],
      params: {
        magicLink,
        existingSignatureName,
        beneficiaryFirstName: application.firstName,
        beneficiaryLastName: application.lastName,
        immersionProfession: application.immersionAppellation.appellationLabel,
        mentor: application.mentor,
        businessName: application.businessName,
      },
    });
  }
}

const getMailParamsDependingOnRole = (
  recipientRole: Extract<Role, "beneficiary" | "establishment">,
  application: ConventionDto,
): {
  existingSignatureName: string;
  recipientEmail: string;
} => {
  switch (recipientRole) {
    case "beneficiary":
      return {
        recipientEmail: application.email,
        existingSignatureName: application.mentor,
      };

    case "establishment":
      return {
        recipientEmail: application.mentorEmail,
        existingSignatureName:
          application.firstName + " " + application.lastName.toUpperCase(),
      };

    default: {
      const _exhaustiveCheck: never = recipientRole;
      throw new Error("Unknown role");
    }
  }
};

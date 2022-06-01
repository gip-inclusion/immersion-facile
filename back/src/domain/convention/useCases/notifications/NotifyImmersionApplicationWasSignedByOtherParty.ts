import { ConventionDto } from "shared/src/convention/convention.dto";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);

export class NotifyImmersionApplicationWasSignedByOtherParty extends UseCase<ConventionDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
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

    await this.emailFilter.withAllowedRecipients(
      [recipientEmail],
      ([recipientEmail]) =>
        this.emailGateway.sendSignedByOtherPartyNotification(recipientEmail, {
          magicLink,
          existingSignatureName,
          beneficiaryFirstName: application.firstName,
          beneficiaryLastName: application.lastName,
          immersionProfession:
            application.immersionAppellation.appellationLabel,
          mentor: application.mentor,
          businessName: application.businessName,
        }),
      logger,
    );
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

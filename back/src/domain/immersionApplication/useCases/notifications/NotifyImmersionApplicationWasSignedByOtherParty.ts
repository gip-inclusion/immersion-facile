import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

export class NotifyImmersionApplicationWasSignedByOtherParty extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(application: ImmersionApplicationDto): Promise<void> {
    const recipientRole: Role = application.beneficiaryAccepted
      ? "establishment"
      : "beneficiary";

    const { recipientEmail, existingSignatureName } =
      getMailParamsDependingOnRole(recipientRole, application);

    const magicLink = this.generateMagicLinkFn({
      id: application.id,
      role: recipientRole,
      targetRoute: frontRoutes.immersionApplicationsToSign,
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
  application: ImmersionApplicationDto,
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

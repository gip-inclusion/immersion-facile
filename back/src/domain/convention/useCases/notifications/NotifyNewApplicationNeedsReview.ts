import { AgencyDto } from "shared/src/agency/agency.dto";
import {
  ConventionStatus,
  ConventionDto,
} from "shared/src/convention/convention.dto";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);

export class NotifyNewApplicationNeedsReview extends UseCase<ConventionDto> {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(conventionDto: ConventionDto): Promise<void> {
    const agency = await this.agencyRepository.getById(conventionDto.agencyId);

    if (!agency) {
      logger.error(
        { agencyId: conventionDto.agencyId },
        "No Agency Config found for this agency code",
      );
      return;
    }

    const recipients = determineRecipients(conventionDto.status, agency);
    logger.debug("conventionDto.status : " + conventionDto.status);

    if (!recipients) {
      logger.error(
        {
          applicationId: conventionDto.id,
          status: conventionDto.status,
          agencyId: conventionDto.agencyId,
        },
        "Unable to find appropriate recipient for validation notification.",
      );
      return;
    }

    logger.info(
      {
        recipients,
        applicationId: conventionDto.id,
      },
      "Sending Mail to review an immersion",
    );

    await Promise.all(
      recipients.emails.map((email) =>
        this.emailGateway.sendEmail({
          type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
          recipients: [email],
          params: {
            businessName: conventionDto.businessName,
            magicLink: this.generateMagicLinkFn({
              id: conventionDto.id,
              role: recipients.role,
              targetRoute: frontRoutes.conventionToValidate,
              email,
            }),
            beneficiaryFirstName: conventionDto.firstName,
            beneficiaryLastName: conventionDto.lastName,
            possibleRoleAction:
              recipients.role === "counsellor"
                ? "en vérifier l'éligibilité"
                : "en considérer la validation",
          },
        }),
      ),
    );

    logger.info(
      {
        recipients,
        conventionId: conventionDto.id,
      },
      "Mail to review an immersion sent",
    );
  }
}

type Recipients = {
  role: Role;
  emails: string[];
};

const determineRecipients = (
  status: ConventionStatus,
  agency: AgencyDto,
): Recipients | undefined => {
  const hasCounsellorEmails = agency.counsellorEmails.length > 0;
  const hasValidatorEmails = agency.validatorEmails.length > 0;
  const hasAdminEmails = agency.adminEmails.length > 0;

  switch (status) {
    case "IN_REVIEW": {
      if (hasCounsellorEmails)
        return { role: "counsellor", emails: agency.counsellorEmails };
      if (hasValidatorEmails)
        return { role: "validator", emails: agency.validatorEmails };
      return;
    }
    case "ACCEPTED_BY_COUNSELLOR":
      return hasValidatorEmails
        ? { role: "validator", emails: agency.validatorEmails }
        : undefined;
    case "ACCEPTED_BY_VALIDATOR":
      return hasAdminEmails
        ? { role: "admin", emails: agency.adminEmails }
        : undefined;
    default:
      // This notification may fire when using the /debug/populate route, with
      // statuses not included in the above list. Ignore this case.
      return;
  }
};

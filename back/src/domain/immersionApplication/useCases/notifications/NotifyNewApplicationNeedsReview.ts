import type { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { frontRoutes } from "../../../../shared/routes";

import {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "../../../../shared/ImmersionApplicationDto";
import { Role } from "../../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { AgencyConfig } from "./../../ports/AgencyRepository";

const logger = createLogger(__filename);

export class NotifyNewApplicationNeedsReview
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {}

  public async execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<void> {
    const agencyConfig = await this.agencyRepository.getConfig(
      immersionApplicationDto.agencyCode,
    );
    if (!agencyConfig) {
      logger.error(
        { agencyCode: immersionApplicationDto.agencyCode },
        "No Agency Config found for this agency code",
      );
      return;
    }

    const recipients = determineRecipients(
      immersionApplicationDto.status,
      agencyConfig,
    );

    if (!recipients) {
      logger.error(
        {
          applicationId: immersionApplicationDto.id,
          status: immersionApplicationDto.status,
          agencyCode: immersionApplicationDto.agencyCode,
        },
        "Unable to find appropriate recipient for validation notification.",
      );
      return;
    }

    logger.info(
      {
        recipients: recipients,
        applicationId: immersionApplicationDto.id,
      },
      "Sending Mail to review an immersion",
    );

    await this.emailGateway.sendNewApplicationForReviewNotification(
      recipients.emails,
      {
        businessName: immersionApplicationDto.businessName,
        magicLink: this.generateMagicLinkFn(
          immersionApplicationDto.id,
          recipients.role,
          frontRoutes.immersionApplicationsToValidate,
        ),
        beneficiaryFirstName: immersionApplicationDto.firstName,
        beneficiaryLastName: immersionApplicationDto.lastName,
        possibleRoleAction:
          recipients.role === "counsellor"
            ? "en vérifier l'éligibilité"
            : "en considérer la validation",
      },
    );

    logger.info(
      {
        recipients: recipients,
        immersionId: immersionApplicationDto.id,
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
  status: ApplicationStatus,
  agencyConfig: AgencyConfig,
): Recipients | undefined => {
  const hasCounsellorEmails = agencyConfig.counsellorEmails.length > 0;
  const hasValidatorEmails = agencyConfig.validatorEmails.length > 0;
  const hasAdminEmails = agencyConfig.adminEmails.length > 0;
  switch (status) {
    case "IN_REVIEW": {
      if (hasCounsellorEmails)
        return { role: "counsellor", emails: agencyConfig.counsellorEmails };
      if (hasValidatorEmails)
        return { role: "validator", emails: agencyConfig.validatorEmails };
      return undefined;
    }
    case "ACCEPTED_BY_COUNSELLOR":
      return hasValidatorEmails
        ? { role: "validator", emails: agencyConfig.validatorEmails }
        : undefined;
    case "ACCEPTED_BY_VALIDATOR":
      return hasAdminEmails
        ? { role: "admin", emails: agencyConfig.adminEmails }
        : undefined;
    default:
      throw new Error(`Unexpected status: ${status}`);
  }
};

import {
  ImmersionApplicationDto,
  ImmersionApplicationId,
} from "../../../../shared/ImmersionApplicationDto";
import { Role } from "../../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export type GenerateMagicLinkFn = (
  applicationId: ImmersionApplicationId,
  role: Role,
) => string;

export class NotifyNewApplicationNeedsReview
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateMagicLinkFn,
  ) {}

  public async execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<void> {
    let targetMailRecicipients: string[] = [];
    let immersionApplicationReviewerRole: Role = "establishment";
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

    if (agencyConfig.counsellorEmails.length > 0) {
      targetMailRecicipients = agencyConfig.counsellorEmails;
      immersionApplicationReviewerRole = "counsellor";
    } else {
      if (
        agencyConfig.counsellorEmails.length < 1 &&
        agencyConfig.validatorEmails.length > 0
      ) {
        targetMailRecicipients = agencyConfig.validatorEmails;
        immersionApplicationReviewerRole = "validator";
      } else {
        if (
          agencyConfig.counsellorEmails.length < 1 &&
          agencyConfig.validatorEmails.length < 1
        ) {
          logger.info(
            {
              immersionId: immersionApplicationDto.id,
            },
            "No Counsellor to review eligibility neither validator to validate this Immersion Application",
          );
          return;
        }
      }
    }

    logger.info(
      {
        recipients: targetMailRecicipients,
        immersionId: immersionApplicationDto.id,
      },
      "Sending Mail to review an immersion",
    );

    await this.emailGateway.sendNewApplicationForReviewNotification(
      targetMailRecicipients,
      {
        businessName: immersionApplicationDto.businessName,
        magicLink: this.generateMagicLinkFn(
          immersionApplicationDto.id,
          immersionApplicationReviewerRole,
        ),
        beneficiaryFirstName: immersionApplicationDto.firstName,
        beneficiaryLastName: immersionApplicationDto.lastName,
        possibleRoleAction:
          immersionApplicationReviewerRole === "counsellor"
            ? "en vérifier l'éligibilité"
            : "en considérer la validation",
      },
    );

    logger.info(
      {
        recipients: targetMailRecicipients,
        immersionId: immersionApplicationDto.id,
      },
      " Mail to review an immersion sent",
    );
  }
}

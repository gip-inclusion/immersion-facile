import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  RejectedApplicationNotificationParams,
} from "../../ports/EmailGateway";
import { AgencyConfig } from "./../../ports/AgencyRepository";

const logger = createLogger(__filename);
export class NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly agencyRepository: AgencyRepository,
  ) {}

  public async execute(dto: ImmersionApplicationDto): Promise<void> {
    const agencyConfig = await this.agencyRepository.getConfig(dto.agencyCode);
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${dto.agencyCode}`,
      );
    }

    let recipients = [
      dto.email,
      dto.mentorEmail,
      ...agencyConfig.counsellorEmails,
    ];
    if (!agencyConfig.allowUnrestrictedEmailSending) {
      recipients = recipients.filter((email) => {
        if (!this.emailAllowList.has(email)) {
          logger.info(`Skipped sending email to: ${email}`);
          return false;
        }
        return true;
      });
    }

    if (recipients.length > 0) {
      await this.emailGateway.sendRejectedApplicationNotification(
        recipients,
        getRejectedApplicationNotificationParams(dto, agencyConfig),
      );
    } else {
      logger.info(
        {
          id: dto.id,
          recipients,
          source: dto.source,
          rejectionJustification: dto.rejectionJustification,
        },
        "Sending validation confirmation email skipped.",
      );
    }
  }
}

const getRejectedApplicationNotificationParams = (
  dto: ImmersionApplicationDto,
  agencyConfig: AgencyConfig,
): RejectedApplicationNotificationParams => {
  return {
    beneficiaryFirstName: dto.firstName,
    beneficiaryLastName: dto.lastName,
    businessName: dto.businessName,
    rejectionReason: dto.rejectionJustification || "",
    signature: agencyConfig.signature,
    agency: agencyConfig.name,
    immersionProfession: dto.immersionProfession,
  };
};

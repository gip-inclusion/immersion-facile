import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  RejectedApplicationNotificationParams,
} from "../../ports/EmailGateway";
import { AgencyConfig } from "./../../ports/AgencyRepository";

const logger = createLogger(__filename);
export class NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(dto: ImmersionApplicationDto): Promise<void> {
    const agencyConfig = await this.agencyRepository.getById(dto.agencyId);
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${dto.agencyId}`,
      );
    }

    const recipients = this.emailFilter.filter(
      [dto.email, dto.mentorEmail, ...agencyConfig.counsellorEmails],
      {
        onRejected: (email) =>
          logger.info(`Skipped sending email to: ${email}`),
      },
    );

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

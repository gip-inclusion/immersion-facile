import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  RejectedApplicationNotificationParams,
} from "../../ports/EmailGateway";
import { AgencyConfig } from "../../ports/AgencyRepository";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "../../../../shared/ImmersionApplication/immersionApplication.schema";

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

    const recipients = [
      dto.email,
      dto.mentorEmail,
      ...agencyConfig.counsellorEmails,
    ];
    await this.emailFilter.withAllowedRecipients(
      recipients,
      (recipients) =>
        this.emailGateway.sendRejectedApplicationNotification(
          recipients,
          getRejectedApplicationNotificationParams(dto, agencyConfig),
        ),
      logger,
    );
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

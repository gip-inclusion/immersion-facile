import { Agency } from "shared/src/agency/agency.dto";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  RejectedApplicationNotificationParams,
} from "../../ports/EmailGateway";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

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
    const agency = await this.agencyRepository.getById(dto.agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${dto.agencyId}`,
      );
    }

    const recipients = [dto.email, dto.mentorEmail, ...agency.counsellorEmails];
    await this.emailFilter.withAllowedRecipients(
      recipients,
      (recipients) =>
        this.emailGateway.sendRejectedApplicationNotification(
          recipients,
          getRejectedApplicationNotificationParams(dto, agency),
        ),
      logger,
    );
  }
}

const getRejectedApplicationNotificationParams = (
  dto: ImmersionApplicationDto,
  agency: Agency,
): RejectedApplicationNotificationParams => ({
  beneficiaryFirstName: dto.firstName,
  beneficiaryLastName: dto.lastName,
  businessName: dto.businessName,
  rejectionReason: dto.rejectionJustification || "",
  signature: agency.signature,
  agency: agency.name,
  immersionProfession: dto.immersionAppellation.appellationLabel,
});

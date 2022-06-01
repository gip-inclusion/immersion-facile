import { AgencyDto } from "shared/src/agency/agency.dto";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  RejectedConventionNotificationParams,
} from "../../ports/EmailGateway";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);
export class NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected extends UseCase<ConventionDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
  ) {
    super();
  }

  inputSchema = conventionSchema;

  public async _execute(dto: ConventionDto): Promise<void> {
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
        this.emailGateway.sendRejectedConventionNotification(
          recipients,
          getRejectedApplicationNotificationParams(dto, agency),
        ),
      logger,
    );
  }
}

const getRejectedApplicationNotificationParams = (
  dto: ConventionDto,
  agency: AgencyDto,
): RejectedConventionNotificationParams => ({
  beneficiaryFirstName: dto.firstName,
  beneficiaryLastName: dto.lastName,
  businessName: dto.businessName,
  rejectionReason: dto.rejectionJustification || "",
  signature: agency.signature,
  agency: agency.name,
  immersionProfession: dto.immersionAppellation.appellationLabel,
});

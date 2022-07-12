import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected extends UseCase<ConventionDto> {
  constructor(
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
    await this.emailGateway.sendEmail({
      type: "REJECTED_CONVENTION_NOTIFICATION",
      recipients,
      params: {
        beneficiaryFirstName: dto.firstName,
        beneficiaryLastName: dto.lastName,
        businessName: dto.businessName,
        rejectionReason: dto.rejectionJustification || "",
        signature: agency.signature,
        agency: agency.name,
        immersionProfession: dto.immersionAppellation.appellationLabel,
      },
    });
  }
}

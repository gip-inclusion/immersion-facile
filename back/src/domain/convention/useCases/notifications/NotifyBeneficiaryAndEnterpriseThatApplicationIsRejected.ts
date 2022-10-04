import { ConventionDto, conventionSchema } from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(dto: ConventionDto, uow: UnitOfWork): Promise<void> {
    const agency = await uow.agencyRepository.getById(dto.agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${dto.agencyId}`,
      );
    }
    const beneficiary = dto.signatories.beneficiary;
    const establishmentRepresentative =
      dto.signatories.establishmentRepresentative;

    const recipients = [
      beneficiary.email,
      establishmentRepresentative.email,
      ...agency.counsellorEmails,
    ];
    await this.emailGateway.sendEmail({
      type: "REJECTED_CONVENTION_NOTIFICATION",
      recipients,
      params: {
        beneficiaryFirstName: beneficiary.firstName,
        beneficiaryLastName: beneficiary.lastName,
        businessName: dto.businessName,
        rejectionReason: dto.rejectionJustification || "",
        signature: agency.signature,
        agency: agency.name,
        immersionProfession: dto.immersionAppellation.appellationLabel,
      },
    });
  }
}

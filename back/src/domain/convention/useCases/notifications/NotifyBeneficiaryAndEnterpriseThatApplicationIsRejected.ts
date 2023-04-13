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

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }
    const beneficiary = convention.signatories.beneficiary;
    const establishmentRepresentative =
      convention.signatories.establishmentRepresentative;

    const recipients = [
      beneficiary.email,
      establishmentRepresentative.email,
      ...agency.counsellorEmails,
    ];

    await this.emailGateway.sendEmail({
      type: "REJECTED_CONVENTION_NOTIFICATION",
      recipients,
      params: {
        internshipKind: convention.internshipKind,
        beneficiaryFirstName: beneficiary.firstName,
        beneficiaryLastName: beneficiary.lastName,
        businessName: convention.businessName,
        rejectionReason: convention.statusJustification || "",
        signature: agency.signature,
        agency: agency.name,
        immersionProfession: convention.immersionAppellation.appellationLabel,
        agencyLogoUrl: agency.logoUrl,
      },
    });
  }
}

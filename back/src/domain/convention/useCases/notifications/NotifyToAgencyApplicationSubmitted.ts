import {
  ConventionDto,
  conventionSchema,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  Role,
} from "shared";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyToAgencyApplicationSubmitted extends TransactionalUseCase<
  ConventionDto,
  void
> {
  inputSchema = conventionSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    const hasCounsellors = agency.counsellorEmails.length > 0;

    if (!hasCounsellors)
      return this.sendEmailToRecipients({
        recipients: agency.validatorEmails,
        convention,
        agencyName: agency.name,
        role: "validator",
      });

    return this.sendEmailToRecipients({
      recipients: agency.counsellorEmails,
      convention,
      agencyName: agency.name,
      role: "counsellor",
    });
  }

  private async sendEmailToRecipients({
    recipients,
    convention,
    agencyName,
    role,
  }: {
    recipients: string[];
    convention: ConventionDto;
    agencyName: string;
    role: Role;
  }) {
    await Promise.all(
      recipients.map((counsellorEmail) => {
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: convention.id,
            role,
            email: counsellorEmail,
            now: this.timeGateway.now(),
          };

        return this.emailGateway.sendEmail({
          type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [counsellorEmail],
          params: {
            agencyName,
            businessName: convention.businessName,
            dateEnd: convention.dateEnd,
            dateStart: convention.dateStart,
            demandeId: convention.id,
            firstName: convention.signatories.beneficiary.firstName,
            lastName: convention.signatories.beneficiary.lastName,
            magicLink: this.generateMagicLinkFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionToValidate,
            }),
            conventionStatusLink: this.generateMagicLinkFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionStatusDashboard,
            }),
          },
        });
      }),
    );
  }
}

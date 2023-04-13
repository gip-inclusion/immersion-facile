import {
  AgencyDto,
  ConventionDto,
  conventionSchema,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  Role,
} from "shared";

import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
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
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
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

    const recipients: {
      recipients: string[];
      role: Role;
    } = hasCounsellors
      ? {
          recipients: agency.counsellorEmails,
          role: "counsellor",
        }
      : {
          recipients: agency.validatorEmails,
          role: "validator",
        };

    return this.sendEmailToRecipients({
      agency,
      convention,
      ...recipients,
      warning: await this.makeWarning(agency, convention, uow),
    });
  }

  private async sendEmailToRecipients({
    agency,
    recipients,
    convention,
    role,
    warning,
  }: {
    recipients: string[];
    agency: AgencyDto;
    convention: ConventionDto;
    role: Role;
    warning?: string;
  }) {
    await Promise.all(
      recipients.map((email) => {
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: convention.id,
            role,
            email,
            now: this.timeGateway.now(),
          };

        return this.emailGateway.sendEmail({
          type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [email],
          params: {
            internshipKind: convention.internshipKind,
            agencyName: agency.name,
            businessName: convention.businessName,
            dateEnd: convention.dateEnd,
            dateStart: convention.dateStart,
            demandeId: convention.id,
            firstName: convention.signatories.beneficiary.firstName,
            lastName: convention.signatories.beneficiary.lastName,
            magicLink: this.generateConventionMagicLinkUrl({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.manageConvention,
            }),
            conventionStatusLink: this.generateConventionMagicLinkUrl({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionStatusDashboard,
            }),
            agencyLogoUrl: agency.logoUrl,
            warning,
          },
        });
      }),
    );
  }
  private async makeWarning(
    agency: AgencyDto,
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<string | undefined> {
    if (agency.kind !== "pole-emploi") return;
    const conventionAdsivorEntity =
      await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        convention.id,
      );
    const advisor = conventionAdsivorEntity?.advisor;
    return !advisor
      ? "Attention: aucun conseiller référent Pôle emploi ne semble être associé à ce bénéficiaire."
      : `Un mail a également été envoyé au conseiller référent (${advisor.firstName} ${advisor.lastName} - ${advisor.email})`;
  }
}

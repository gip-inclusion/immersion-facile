import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
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
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepo.getById(convention.agencyId);
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
      recipients.map((counsellorEmail) =>
        this.emailGateway.sendEmail({
          type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: [counsellorEmail],
          params: {
            agencyName,
            businessName: convention.businessName,
            dateEnd: convention.dateEnd,
            dateStart: convention.dateStart,
            demandeId: convention.id,
            firstName: convention.firstName,
            lastName: convention.lastName,
            magicLink: this.generateMagicLinkFn({
              id: convention.id,
              role,
              targetRoute: frontRoutes.conventionToValidate,
              email: counsellorEmail,
            }),
          },
        }),
      ),
    );
  }
}

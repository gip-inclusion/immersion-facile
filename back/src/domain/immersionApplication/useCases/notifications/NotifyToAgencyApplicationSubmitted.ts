import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config/createGenerateVerificationMagicLink";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../../../utils/logger";

const logger = createLogger(__filename);

export class NotifyToAgencyApplicationSubmitted extends TransactionalUseCase<
  ImmersionApplicationDto,
  void
> {
  inputSchema = immersionApplicationSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    application: ImmersionApplicationDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepo.getById(application.agencyId);
    if (!agency) {
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${application.agencyId}`,
      );
    }

    const hasCounsellors = agency.counsellorEmails.length > 0;

    if (!hasCounsellors)
      return this.sendEmailToRecipients({
        recipients: agency.validatorEmails,
        application,
        agencyName: agency.name,
        role: "validator",
      });

    return this.sendEmailToRecipients({
      recipients: agency.counsellorEmails,
      application,
      agencyName: agency.name,
      role: "counsellor",
    });
  }

  private async sendEmailToRecipients({
    recipients,
    application,
    agencyName,
    role,
  }: {
    recipients: string[];
    application: ImmersionApplicationDto;
    agencyName: string;
    role: Role;
  }) {
    await this.emailFilter.withAllowedRecipients(
      recipients,
      async (filteredRecipients) => {
        await Promise.all(
          filteredRecipients.map((counsellorEmail) =>
            this.emailGateway.sendNewApplicationAgencyNotification(
              [counsellorEmail],
              {
                agencyName,
                businessName: application.businessName,
                dateEnd: application.dateEnd,
                dateStart: application.dateStart,
                demandeId: application.id,
                firstName: application.firstName,
                lastName: application.lastName,
                magicLink: this.generateMagicLinkFn(
                  application.id,
                  role,
                  frontRoutes.immersionApplicationsToValidate,
                  counsellorEmail,
                ),
              },
            ),
          ),
        );
      },
      logger,
    );
  }
}

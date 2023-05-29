import { addDays } from "date-fns";
import { z } from "zod";
import { ConventionDto, ConventionId, frontRoutes } from "shared";
import { GenerateConventionMagicLinkUrl } from "../../../adapters/primary/config/magicLinkUrl";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { NotificationGateway } from "../../generic/notifications/ports/NotificationGateway";

const logger = createLogger(__filename);

type SendEmailsWithAssessmentCreationLinkOutput = {
  errors?: Record<ConventionId, any>;
  numberOfImmersionEndingTomorrow: number;
};

export class SendEmailsWithAssessmentCreationLink extends TransactionalUseCase<
  void,
  SendEmailsWithAssessmentCreationLinkOutput
> {
  inputSchema = z.void();

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private notificationGateway: NotificationGateway,
    private timeGateway: TimeGateway,
    private generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<SendEmailsWithAssessmentCreationLinkOutput> {
    const now = this.timeGateway.now();
    const tomorrow = addDays(now, 1);
    const conventions =
      await uow.conventionQueries.getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
        tomorrow,
      );

    logger.info(
      `[${now.toISOString()}]: About to send assessment email to ${
        conventions.length
      } establishments`,
    );
    if (conventions.length === 0) return { numberOfImmersionEndingTomorrow: 0 };

    const errors: Record<ConventionId, any> = {};
    await Promise.all(
      conventions.map(async (convention) => {
        await this._sendOneEmailWithImmersionAssessmentCreationLink(
          uow,
          convention,
        ).catch((error: any) => {
          errors[convention.id] = error;
        });
      }),
    );

    return {
      numberOfImmersionEndingTomorrow: conventions.length,
      errors,
    };
  }

  private async _sendOneEmailWithImmersionAssessmentCreationLink(
    uow: UnitOfWork,
    convention: ConventionDto,
  ) {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw new Error(`Missing agency ${convention.agencyId} on repository.`);

    await this.notificationGateway.sendEmail({
      type: "CREATE_IMMERSION_ASSESSMENT",
      recipients: [convention.establishmentTutor.email],
      params: {
        internshipKind: convention.internshipKind,
        immersionAssessmentCreationLink: this.generateConventionMagicLinkUrl({
          id: convention.id,
          email: convention.establishmentTutor.email,
          role: "establishment",
          targetRoute: frontRoutes.immersionAssessment,
          now: this.timeGateway.now(),
        }),
        establishmentTutorName:
          convention.establishmentTutor.firstName +
          " " +
          convention.establishmentTutor.lastName,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        agencyLogoUrl: agency.logoUrl,
        agencyValidatorEmail: agency.validatorEmails[0],
      },
    });

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: { id: convention.id },
      }),
    );
  }
}

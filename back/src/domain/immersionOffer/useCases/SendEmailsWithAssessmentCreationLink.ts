import { addDays } from "date-fns";
import { ConventionDto, ConventionId, frontRoutes } from "shared";
import { z } from "zod";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../utils/logger";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

export class SendEmailsWithAssessmentCreationLink extends TransactionalUseCase<void> {
  inputSchema = z.void();

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private emailGateway: EmailGateway,
    private timeGateway: TimeGateway,
    private generateConventionMagicLink: GenerateConventionMagicLink,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(_: void, uow: UnitOfWork): Promise<void> {
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
    if (conventions.length === 0) return;

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

    // Notify discord with a
    this.notifyDiscord(errors, conventions.length);
  }

  private async _sendOneEmailWithImmersionAssessmentCreationLink(
    uow: UnitOfWork,
    convention: ConventionDto,
  ) {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency)
      throw new Error(`Missing agency ${convention.agencyId} on repository.`);

    await this.emailGateway.sendEmail({
      type: "CREATE_IMMERSION_ASSESSMENT",
      recipients: [convention.establishmentTutor.email],
      params: {
        internshipKind: convention.internshipKind,
        immersionAssessmentCreationLink: this.generateConventionMagicLink({
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
      },
    });

    await uow.outboxRepository.save(
      this.createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: { id: convention.id },
      }),
    );
  }

  private notifyDiscord(
    errors: Record<ConventionId, any>,
    numberOfAssessmentEndingTomorrow: number,
  ) {
    const nSendingEmailFailures = Object.keys(errors).length;
    const nSendingEmailSuccess =
      numberOfAssessmentEndingTomorrow - nSendingEmailFailures;

    const scriptSummaryMessage = `[triggerSendingEmailWithImmersionAssessmentCreationLinkOneDayBeforeItEnds] Script summary: Succeed: ${nSendingEmailSuccess}; Failed: ${nSendingEmailFailures}\nErrors were: ${Object.keys(
      errors,
    )
      .map(
        (immersionId) =>
          `For immersion ids ${immersionId} : ${errors[immersionId]} `,
      )
      .join("\n")}`;

    notifyDiscord(scriptSummaryMessage);
    logger.info(scriptSummaryMessage);
  }
}

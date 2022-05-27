import { createConventionJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { GenerateCreateImmersionAssessmentUrl } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../../immersionApplication/ports/EmailGateway";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { z } from "zod";
import { createLogger } from "../../../utils/logger";
import { addDays } from "date-fns";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { ImmersionApplicationQueries } from "../../immersionApplication/ports/ImmersionApplicationQueries";

const logger = createLogger(__filename);

export type ImmersionAssessmentEmailParams = {
  immersionId: ImmersionApplicationId;
  mentorName: string;
  mentorEmail: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
};
export class SendEmailsWithAssessmentCreationLink extends UseCase<void> {
  inputSchema = z.void();

  constructor(
    private outboxRepo: OutboxRepository,
    private applicationQueries: ImmersionApplicationQueries,
    private emailGateway: EmailGateway,
    private clock: Clock,
    private generateCreateImmersionAssessmentUrl: GenerateCreateImmersionAssessmentUrl,
    private createNewEvent: CreateNewEvent,
  ) {
    super();
  }

  protected async _execute(): Promise<void> {
    const now = this.clock.now();
    const tomorrow = addDays(now, 1);
    const assessmentEmailParamsOfImmersionEndingTomorrow =
      await this.applicationQueries.getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
        tomorrow,
      );
    if (assessmentEmailParamsOfImmersionEndingTomorrow.length === 0) return;

    const errors: Record<ImmersionApplicationId, any> = {};
    await Promise.all(
      assessmentEmailParamsOfImmersionEndingTomorrow.map(
        async (immersionEndingTomorrow) => {
          await this._sendOneEmailWithImmersionAssessmentCreationLink(
            now,
            immersionEndingTomorrow,
          ).catch((error: any) => {
            errors[immersionEndingTomorrow.immersionId] = error;
          });
        },
      ),
    );

    // Notify discord with a
    this.notifyDiscord(
      errors,
      assessmentEmailParamsOfImmersionEndingTomorrow.length,
    );
  }
  private async _sendOneEmailWithImmersionAssessmentCreationLink(
    now: Date,
    immersionAssessmentEmailParams: ImmersionAssessmentEmailParams,
  ) {
    const payload = createConventionJwtPayload({
      id: immersionAssessmentEmailParams.immersionId,
      now,
      durationDays: 15,
    });
    const immersionAssessmentCreationLink =
      this.generateCreateImmersionAssessmentUrl(payload);

    await this.emailGateway.sendImmersionAssessmentCreationLink(
      immersionAssessmentEmailParams.mentorEmail,
      {
        immersionAssessmentCreationLink,
        mentorName: immersionAssessmentEmailParams.mentorName,
        beneficiaryFirstName:
          immersionAssessmentEmailParams.beneficiaryFirstName,
        beneficiaryLastName: immersionAssessmentEmailParams.beneficiaryLastName,
      },
    );

    const event = this.createNewEvent({
      topic: "EmailWithImmersionAssessmentCreationLinkSent",
      payload,
    });
    await this.outboxRepo.save(event);
  }

  private notifyDiscord(
    errors: Record<ImmersionApplicationId, any>,
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

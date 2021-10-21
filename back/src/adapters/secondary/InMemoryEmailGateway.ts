import { ModificationRequestApplicationNotificationParams } from "./../../domain/immersionApplication/ports/EmailGateway";
import type {
  EmailType,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
  NewImmersionApplicationReviewForEligibilityOrValidationParams,
  RejectedApplicationNotificationParams,
  ValidatedApplicationFinalConfirmationParams,
} from "../../domain/immersionApplication/ports/EmailGateway";
import { EmailGateway } from "../../domain/immersionApplication/ports/EmailGateway";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export type TemplatedEmail = {
  type: EmailType;
  recipients: string[];
  params: Record<string, unknown>;
};

export class InMemoryEmailGateway implements EmailGateway {
  private readonly sentEmails: TemplatedEmail[] = [];

  public async sendNewApplicationBeneficiaryConfirmation(
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams,
  ): Promise<void> {
    logger.info(
      { recipient, params },
      "sendNewApplicationBeneficiaryConfirmation",
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
      recipients: [recipient],
      params,
    });
  }

  public async sendNewApplicationMentorConfirmation(
    recipient: string,
    params: NewApplicationMentorConfirmationParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendNewApplicationMentorConfirmation");
    this.sentEmails.push({
      type: "NEW_APPLICATION_MENTOR_CONFIRMATION",
      recipients: [recipient],
      params,
    });
  }

  public async sendNewApplicationAdminNotification(
    recipients: string[],
    params: NewApplicationAdminNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendNewApplicationAdminNotification");
    this.sentEmails.push({
      type: "NEW_APPLICATION_ADMIN_NOTIFICATION",
      recipients: recipients,
      params,
    });
  }

  public async sendNewApplicationForReviewNotification(
    recipients: string[],
    params: NewImmersionApplicationReviewForEligibilityOrValidationParams,
  ): Promise<void> {
    logger.info(
      { recipients, params },
      "sendNewApplicationForReviewNotification",
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
      recipients: recipients,
      params,
    });
  }

  public async sendValidatedApplicationFinalConfirmation(
    recipients: string[],
    params: ValidatedApplicationFinalConfirmationParams,
  ): Promise<void> {
    logger.info(
      { recipients, params },
      "sendValidatedApplicationFinalConfirmation",
    );
    this.sentEmails.push({
      type: "VALIDATED_APPLICATION_FINAL_CONFIRMATION",
      recipients: recipients,
      params: params,
    });
  }

  public async sendRejectedApplicationNotification(
    recipients: string[],
    params: RejectedApplicationNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRejecteddApplicationNotification");
    this.sentEmails.push({
      type: "REJECTED_APPLICATION_NOTIFICATION",
      recipients: recipients,
      params: params,
    });
  }

  public async sendModificationRequestApplicationNotification(
    recipients: string[],
    params: ModificationRequestApplicationNotificationParams,
  ): Promise<void> {
    logger.info(
      { recipients, params },
      "sendModificationRequestApplicationNotification",
    );
    this.sentEmails.push({
      type: "MODIFICATION_REQUEST_APPLICATION_NOTIFICATION",
      recipients: recipients,
      params: params,
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails;
  }
}

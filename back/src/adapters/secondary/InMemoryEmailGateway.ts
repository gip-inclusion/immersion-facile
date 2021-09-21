import type {
  EmailType,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
} from "../../domain/demandeImmersion/ports/EmailGateway";
import { EmailGateway } from "../../domain/demandeImmersion/ports/EmailGateway";
import { DemandeImmersionDto } from "../../shared/DemandeImmersionDto";
import { logger } from "../../utils/logger";

export type TemplatedEmail = {
  type: EmailType;
  recipients: string[];
  params: Record<string, unknown>;
};

export class InMemoryEmailGateway implements EmailGateway {
  private readonly logger = logger.child({ logsource: "InMemoryEmailGateway" });
  private readonly sentEmails: TemplatedEmail[] = [];

  public async sendNewApplicationBeneficiaryConfirmation(
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams
  ): Promise<void> {
    this.logger.info(
      { recipient, params },
      "sendNewApplicationBeneficiaryConfirmation"
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
      recipients: [recipient],
      params,
    });
  }

  public async sendNewApplicationMentorConfirmation(
    recipient: string,
    params: NewApplicationMentorConfirmationParams
  ): Promise<void> {
    this.logger.info(
      { recipient, params },
      "sendNewApplicationMentorConfirmation"
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_MENTOR_CONFIRMATION",
      recipients: [recipient],
      params,
    });
  }

  public async sendNewApplicationAdminNotification(
    recipients: string[],
    params: NewApplicationAdminNotificationParams
  ): Promise<void> {
    this.logger.info(
      { recipients, params },
      "sendNewApplicationAdminNotification"
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_ADMIN_NOTIFICATION",
      recipients: recipients,
      params,
    });
  }

  public async sendValidatedApplicationFinalConfirmation(
    recipients: string[],
    dto: DemandeImmersionDto
  ): Promise<void> {
    this.logger.info(
      { recipients, dto },
      "sendValidatedApplicationFinalConfirmation"
    );
    this.sentEmails.push({
      type: "VALIDATED_APPLICATION_FINAL_CONFIRMATION",
      recipients: recipients,
      params: dto,
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails;
  }
}

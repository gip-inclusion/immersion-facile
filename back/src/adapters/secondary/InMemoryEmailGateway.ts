import type {
  EmailType,
  NewDemandeAdminNotificationParams,
  NewDemandeBeneficiaireConfirmationParams,
} from "../../domain/demandeImmersion/ports/EmailGateway";
import { EmailGateway } from "../../domain/demandeImmersion/ports/EmailGateway";
import { logger } from "../../utils/logger";

export type TemplatedEmail = {
  type: EmailType;
  recipients: string[];
  params: Object;
};

export class InMemoryEmailGateway implements EmailGateway {
  private readonly logger = logger.child({ logsource: "InMemoryEmailGateway" });
  private readonly sentEmails: TemplatedEmail[] = [];

  public async sendNewDemandeBeneficiaireConfirmation(
    recipient: string,
    params: NewDemandeBeneficiaireConfirmationParams
  ): Promise<void> {
    this.logger.info(
      { recipient, params },
      "sendNewDemandeBeneficiaireConfirmation"
    );
    this.sentEmails.push({
      type: "NEW_DEMANDE_BENEFICIAIRE_CONFIRMATION",
      recipients: [recipient],
      params,
    });
  }

  public async sendNewDemandeAdminNotification(
    recipients: string[],
    params: NewDemandeAdminNotificationParams
  ): Promise<void> {
    this.logger.info({ recipients, params }, "sendNewDemandeAdminNotification");
    this.sentEmails.push({
      type: "NEW_DEMANDE_ADMIN_NOTIFICATION",
      recipients: recipients,
      params,
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails;
  }
}

import type {
  BeneficiarySignatureRequestNotificationParams,
  EmailType,
  EnterpriseSignatureRequestNotificationParams,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
  NewImmersionApplicationReviewForEligibilityOrValidationParams,
  RejectedApplicationNotificationParams,
  SignedByOtherPartyNotificationParams,
  ValidatedApplicationFinalConfirmationParams,
} from "../../domain/immersionApplication/ports/EmailGateway";
import { EmailGateway } from "../../domain/immersionApplication/ports/EmailGateway";
import { FormEstablishmentDto } from "../../shared/FormEstablishmentDto";
import { createLogger } from "../../utils/logger";
import {
  ModificationRequestApplicationNotificationParams,
  SendRenewedMagicLinkParams,
} from "./../../domain/immersionApplication/ports/EmailGateway";

const logger = createLogger(__filename);

export type TemplatedEmail = {
  type: EmailType;
  recipients: string[];
  params: Record<string, unknown>;
};

export class InMemoryEmailGateway implements EmailGateway {
  private readonly sentEmails: TemplatedEmail[] = [];

  public async sendNewEstablismentContactConfirmation(
    recipient: string,
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<void> {
    logger.info(
      { recipient, formEstablishmentDto },
      "sendNewEstablismentContactConfirmation",
    );
    this.sentEmails.push({
      type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
      recipients: [recipient],
      params: { establishmentDto: formEstablishmentDto },
    });
  }

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

  public async sendRenewedMagicLink(
    recipients: string[],
    params: SendRenewedMagicLinkParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRenewedMagicLink");
    this.sentEmails.push({
      type: "MAGIC_LINK_RENEWAL",
      recipients: recipients,
      params: params,
    });
  }

  public async sendSignedByOtherPartyNotification(
    recipient: string,
    params: SignedByOtherPartyNotificationParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendSignedByOtherPartyNotification");
    this.sentEmails.push({
      type: "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
      recipients: [recipient],
      params: params,
    });
  }

  public async sendBeneficiarySignatureRequestNotification(
    recipient: string,
    params: BeneficiarySignatureRequestNotificationParams,
  ): Promise<void> {
    logger.info(
      { recipient, params },
      "sendBeneficiarySignatureRequestNotification",
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [recipient],
      params: params,
    });
  }

  public async sendEnterpriseSignatureRequestNotification(
    recipient: string,
    params: EnterpriseSignatureRequestNotificationParams,
  ): Promise<void> {
    logger.info(
      { recipient, params },
      "sendEnterpriseSignatureRequestNotification",
    );
    this.sentEmails.push({
      type: "NEW_APPLICATION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [recipient],
      params: params,
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails;
  }
}

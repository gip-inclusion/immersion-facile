import type {
  BeneficiarySignatureRequestNotificationParams,
  ContactInPersonInstructionsParams,
  ContactByEmailRequestParams,
  ContactByPhoneInstructionsParams,
  EmailType,
  EnterpriseSignatureRequestNotificationParams,
  ModificationRequestApplicationNotificationParams,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
  NewImmersionApplicationReviewForEligibilityOrValidationParams,
  RejectedApplicationNotificationParams,
  SendRenewedMagicLinkParams,
  SignedByOtherPartyNotificationParams,
  ValidatedApplicationFinalConfirmationParams,
} from "../../domain/immersionApplication/ports/EmailGateway";
import {
  EmailGateway,
  ShareDraftApplicationByLinkParams,
} from "../../domain/immersionApplication/ports/EmailGateway";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export type TemplatedEmail = {
  type: EmailType;
  recipients: string[];
  cc: string[];
  params: Record<string, unknown>;
};

export class InMemoryEmailGateway implements EmailGateway {
  private readonly sentEmails: TemplatedEmail[] = [];
  public async sendRequestedEditFormEstablishmentLink(
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ) {
    logger.info({ recipient, params, copy }, "sendEditFormEstablishmentLink");
    this.sentEmails.push({
      type: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: [recipient],
      cc: copy,
      params,
    });
  }
  public async sendFormEstablishmentEditionSuggestion(
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ) {
    logger.info(
      { recipient, params, copy },
      "sendFormEstablishmentEditionSuggestion",
    );
    this.sentEmails.push({
      type: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
      recipients: [recipient],
      cc: copy,
      params,
    });
  }

  public async sendNewEstablismentContactConfirmation(
    recipient: string,
    copy: string[],
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<void> {
    logger.info(
      { recipient, formEstablishmentDto, copy },
      "sendNewEstablismentContactConfirmation",
    );
    this.sentEmails.push({
      type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
      recipients: [recipient],
      cc: copy,
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
      cc: [],
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
      cc: [],
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
      recipients,
      params,
      cc: [],
    });
  }

  public async sendNewApplicationAgencyNotification(
    recipients: string[],
    params: NewApplicationAdminNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendNewApplicationAgencyNotification");
    this.sentEmails.push({
      type: "NEW_APPLICATION_AGENCY_NOTIFICATION",
      recipients,
      params,
      cc: [],
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
      recipients,
      params,
      cc: [],
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
      recipients,
      params,
      cc: [],
    });
  }

  public async sendRejectedApplicationNotification(
    recipients: string[],
    params: RejectedApplicationNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRejecteddApplicationNotification");
    this.sentEmails.push({
      type: "REJECTED_APPLICATION_NOTIFICATION",
      recipients,
      params,
      cc: [],
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
      recipients,
      params,
      cc: [],
    });
  }

  public async sendRenewedMagicLink(
    recipients: string[],
    params: SendRenewedMagicLinkParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRenewedMagicLink");
    this.sentEmails.push({
      type: "MAGIC_LINK_RENEWAL",
      recipients,
      params,
      cc: [],
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
      cc: [],
      params,
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
      cc: [],
      params,
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
      cc: [],
      params,
    });
  }

  public async sendContactByEmailRequest(
    recipient: string,
    copy: string[],
    params: ContactByEmailRequestParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendContactByEmailRequest");
    this.sentEmails.push({
      type: "CONTACT_BY_EMAIL_REQUEST",
      recipients: [recipient],
      cc: copy,
      params,
    });
  }

  public async sendContactByPhoneInstructions(
    recipient: string,
    params: ContactByPhoneInstructionsParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendContactByPhoneInstructions");
    this.sentEmails.push({
      type: "CONTACT_BY_PHONE_INSTRUCTIONS",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  public async sendContactInPersonInstructions(
    recipient: string,
    params: ContactInPersonInstructionsParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendContactInPersonInstructions");
    this.sentEmails.push({
      type: "CONTACT_IN_PERSON_INSTRUCTIONS",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  public async sendShareDraftApplicationByLink(
    recipient: string,
    params: ShareDraftApplicationByLinkParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendShareDraftApplicationByLinkParams");
    this.sentEmails.push({
      type: "SHARE_DRAFT_APPLICATION_BY_LINK",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails;
  }
}

import type {
  BeneficiarySignatureRequestNotificationParams,
  ContactInPersonInstructionsParams,
  ContactByEmailRequestParams,
  ContactByPhoneInstructionsParams,
  EmailType,
  EnterpriseSignatureRequestNotificationParams,
  ConventionModificationRequestNotificationParams,
  NewConventionAdminNotificationParams,
  NewConventionBeneficiaryConfirmationParams,
  NewConventionMentorConfirmationParams,
  NewConventionReviewForEligibilityOrValidationParams,
  RejectedConventionNotificationParams,
  SendRenewedMagicLinkParams,
  SignedByOtherPartyNotificationParams,
  ValidatedConventionFinalConfirmationParams,
  PoleEmploiAdvisorOnConventionAssociationParams,
  PoleEmploiAdvisorOnConventionFullysignedParams,
  AgencyWasActivatedParams,
} from "../../domain/convention/ports/EmailGateway";

import {
  EmailGateway,
  ShareDraftConventionByLinkParams,
} from "../../domain/convention/ports/EmailGateway";
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

  public getLastSentEmails() {
    return this.sentEmails;
  }

  public async sendImmersionAssessmentCreationLink(
    recipient: string,
    params: {
      beneficiaryFirstName: string;
      beneficiaryLastName: string;
      mentorName: string;
      immersionAssessmentCreationLink: string;
    },
  ) {
    logger.info({ recipient, params }, "sendImmersionAssessmentCreationLink");
    this.sentEmails.push({
      type: "CREATE_IMMERSION_ASSESSMENT",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

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

  public async sendNewEstablishmentContactConfirmation(
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

  public async sendNewConventionBeneficiaryConfirmation(
    recipient: string,
    params: NewConventionBeneficiaryConfirmationParams,
  ): Promise<void> {
    logger.info(
      { recipient, params },
      "sendNewApplicationBeneficiaryConfirmation",
    );
    this.sentEmails.push({
      type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  public async sendNewConventionMentorConfirmation(
    recipient: string,
    params: NewConventionMentorConfirmationParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendNewApplicationMentorConfirmation");
    this.sentEmails.push({
      type: "NEW_CONVENTION_MENTOR_CONFIRMATION",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  public async sendNewConventionAdminNotification(
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendNewApplicationAdminNotification");
    this.sentEmails.push({
      type: "NEW_CONVENTION_ADMIN_NOTIFICATION",
      recipients,
      params,
      cc: [],
    });
  }

  public async sendNewConventionAgencyNotification(
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendNewApplicationAgencyNotification");
    this.sentEmails.push({
      type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
      recipients,
      params,
      cc: [],
    });
  }

  public async sendNewConventionForReviewNotification(
    recipients: string[],
    params: NewConventionReviewForEligibilityOrValidationParams,
  ): Promise<void> {
    logger.info(
      { recipients, params },
      "sendNewApplicationForReviewNotification",
    );
    this.sentEmails.push({
      type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
      recipients,
      params,
      cc: [],
    });
  }

  public async sendValidatedConventionFinalConfirmation(
    recipients: string[],
    params: ValidatedConventionFinalConfirmationParams,
  ): Promise<void> {
    logger.info(
      { recipients, params },
      "sendValidatedApplicationFinalConfirmation",
    );
    this.sentEmails.push({
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients,
      params,
      cc: [],
    });
  }

  public async sendRejectedConventionNotification(
    recipients: string[],
    params: RejectedConventionNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRejecteddApplicationNotification");
    this.sentEmails.push({
      type: "REJECTED_CONVENTION_NOTIFICATION",
      recipients,
      params,
      cc: [],
    });
  }

  public async sendConventionModificationRequestNotification(
    recipients: string[],
    params: ConventionModificationRequestNotificationParams,
  ): Promise<void> {
    logger.info(
      { recipients, params },
      "sendModificationRequestApplicationNotification",
    );
    this.sentEmails.push({
      type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
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
      type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
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
      type: "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
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

  public async sendShareDraftConventionByLink(
    recipient: string,
    params: ShareDraftConventionByLinkParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendShareDraftApplicationByLinkParams");
    this.sentEmails.push({
      type: "SHARE_DRAFT_CONVENTION_BY_LINK",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  public async sendToPoleEmploiAdvisorOnConventionAssociation(
    recipient: string,
    params: PoleEmploiAdvisorOnConventionAssociationParams,
  ): Promise<void> {
    logger.info(
      { recipient, params },
      "sendToPoleEmploiAdvisorOnConventionAssociation",
    );
    this.sentEmails.push({
      type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
      recipients: [recipient],
      cc: [],
      params,
    });
  }

  public async sendToPoleEmploiAdvisorOnConventionFullySigned(
    recipient: string,
    params: PoleEmploiAdvisorOnConventionFullysignedParams,
  ): Promise<void> {
    logger.info(
      { recipient, params },
      "sendToPoleEmploiAdvisorOnConventionFullySigned",
    );
    this.sentEmails.push({
      type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
      recipients: [recipient],
      cc: [],
      params,
    });
  }
  public async sendAgencyWasActivated(
    recipients: string[],
    params: AgencyWasActivatedParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendAgencyWasActivated");
    this.sentEmails.push({
      type: "AGENCY_WAS_ACTIVATED",
      recipients,
      cc: [],
      params,
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails;
  }
}

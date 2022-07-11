import type {
  BeneficiarySignatureRequestNotificationParams,
  ContactInPersonInstructionsParams,
  ContactByEmailRequestParams,
  ContactByPhoneInstructionsParams,
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
} from "../../../domain/convention/ports/EmailGateway";

import {
  EmailGateway,
  ShareDraftConventionByLinkParams,
} from "../../../domain/convention/ports/EmailGateway";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { createLogger } from "../../../utils/logger";
import { EmailSentDto, TemplatedEmail } from "shared/email";
import { Clock } from "../../../domain/core/ports/Clock";
import { prop } from "ramda";
import { CustomClock } from "../core/ClockImplementations";

const logger = createLogger(__filename);

export class InMemoryEmailGateway implements EmailGateway {
  public constructor(
    private readonly clock: Clock = new CustomClock(),
    private readonly numberOfEmailToKeep: number | null = null,
  ) {}

  private readonly sentEmails: EmailSentDto[] = [];

  public getLastSentEmailDtos() {
    return this.sentEmails.reverse();
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
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
    this.sendEmail({
      type: "AGENCY_WAS_ACTIVATED",
      recipients,
      cc: [],
      params,
    });
  }

  private sendEmail(templatedEmail: TemplatedEmail) {
    if (!this.numberOfEmailToKeep) {
      this.sentEmails.push({
        templatedEmail,
        sentAt: this.clock.now().toISOString(),
      });
      return;
    }

    const numberOfEmailsToDrop =
      this.sentEmails.length + 1 - this.numberOfEmailToKeep;

    if (numberOfEmailsToDrop > 0) {
      this.sentEmails.splice(0, numberOfEmailsToDrop);
    }

    this.sentEmails.push({
      templatedEmail,
      sentAt: this.clock.now().toISOString(),
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails.map(prop("templatedEmail"));
  }
}

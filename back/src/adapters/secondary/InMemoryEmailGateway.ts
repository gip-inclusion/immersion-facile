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
} from "../../domain/convention/ports/EmailGateway";

import {
  EmailGateway,
  ShareDraftConventionByLinkParams,
} from "../../domain/convention/ports/EmailGateway";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { createLogger } from "../../utils/logger";
import { EmailSentDto, TemplatedEmail } from "shared/email";
import { Clock } from "../../domain/core/ports/Clock";
import { prop } from "ramda";
import { CustomClock } from "./core/ClockImplementations";

const logger = createLogger(__filename);
export class InMemoryEmailGateway implements EmailGateway {
  public constructor(private readonly clock: Clock = new CustomClock()) {}

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
    this.sentEmails.push({
      template: {
        type: "CREATE_IMMERSION_ASSESSMENT",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendRequestedEditFormEstablishmentLink(
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ) {
    logger.info({ recipient, params, copy }, "sendEditFormEstablishmentLink");
    this.sentEmails.push({
      template: {
        type: "EDIT_FORM_ESTABLISHMENT_LINK",
        recipients: [recipient],
        cc: copy,
        params,
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
        recipients: [recipient],
        cc: copy,
        params,
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
        recipients: [recipient],
        cc: copy,
        params: { establishmentDto: formEstablishmentDto },
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendNewConventionMentorConfirmation(
    recipient: string,
    params: NewConventionMentorConfirmationParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendNewApplicationMentorConfirmation");
    this.sentEmails.push({
      template: {
        type: "NEW_CONVENTION_MENTOR_CONFIRMATION",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendNewConventionAdminNotification(
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendNewApplicationAdminNotification");
    this.sentEmails.push({
      template: {
        type: "NEW_CONVENTION_ADMIN_NOTIFICATION",
        recipients,
        params,
        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendNewConventionAgencyNotification(
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendNewApplicationAgencyNotification");
    this.sentEmails.push({
      template: {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients,
        params,
        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
        recipients,
        params,
        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
        recipients,
        params,

        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendRejectedConventionNotification(
    recipients: string[],
    params: RejectedConventionNotificationParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRejecteddApplicationNotification");
    this.sentEmails.push({
      template: {
        type: "REJECTED_CONVENTION_NOTIFICATION",
        recipients,
        params,

        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
        recipients,
        params,

        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendRenewedMagicLink(
    recipients: string[],
    params: SendRenewedMagicLinkParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendRenewedMagicLink");
    this.sentEmails.push({
      template: {
        type: "MAGIC_LINK_RENEWAL",
        recipients,
        params,

        cc: [],
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendSignedByOtherPartyNotification(
    recipient: string,
    params: SignedByOtherPartyNotificationParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendSignedByOtherPartyNotification");
    this.sentEmails.push({
      template: {
        type: "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendContactByEmailRequest(
    recipient: string,
    copy: string[],
    params: ContactByEmailRequestParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendContactByEmailRequest");
    this.sentEmails.push({
      template: {
        type: "CONTACT_BY_EMAIL_REQUEST",
        recipients: [recipient],
        cc: copy,
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendContactByPhoneInstructions(
    recipient: string,
    params: ContactByPhoneInstructionsParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendContactByPhoneInstructions");
    this.sentEmails.push({
      template: {
        type: "CONTACT_BY_PHONE_INSTRUCTIONS",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendContactInPersonInstructions(
    recipient: string,
    params: ContactInPersonInstructionsParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendContactInPersonInstructions");
    this.sentEmails.push({
      template: {
        type: "CONTACT_IN_PERSON_INSTRUCTIONS",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  public async sendShareDraftConventionByLink(
    recipient: string,
    params: ShareDraftConventionByLinkParams,
  ): Promise<void> {
    logger.info({ recipient, params }, "sendShareDraftApplicationByLinkParams");
    this.sentEmails.push({
      template: {
        type: "SHARE_DRAFT_CONVENTION_BY_LINK",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
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
      template: {
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
        recipients: [recipient],
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }
  public async sendAgencyWasActivated(
    recipients: string[],
    params: AgencyWasActivatedParams,
  ): Promise<void> {
    logger.info({ recipients, params }, "sendAgencyWasActivated");
    this.sentEmails.push({
      template: {
        type: "AGENCY_WAS_ACTIVATED",
        recipients,
        cc: [],
        params,
      },
      sentAt: this.clock.now().toISOString(),
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails.map(prop("template"));
  }
}

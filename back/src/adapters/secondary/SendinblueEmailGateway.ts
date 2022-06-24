import promClient from "prom-client";
import * as SibApiV3Sdk from "sib-api-v3-typescript";
import {
  SendSmtpEmail,
  SendSmtpEmailCc,
  SendSmtpEmailTo,
} from "sib-api-v3-typescript";
import type {
  BeneficiarySignatureRequestNotificationParams,
  ContactByEmailRequestParams,
  ContactByPhoneInstructionsParams,
  ContactInPersonInstructionsParams,
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
import { notifyObjectDiscord } from "../../utils/notifyDiscord";

const logger = createLogger(__filename);

const counterSendTransactEmailTotal = new promClient.Counter({
  name: "sendinblue_send_transac_email_total",
  help: "The total count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType"],
});

const counterSendTransactEmailSuccess = new promClient.Counter({
  name: "sendinblue_send_transac_email_success",
  help: "The success count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType"],
});

const counterSendTransactEmailError = new promClient.Counter({
  name: "sendinblue_send_transac_email_error",
  help: "The error count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType", "errorType"],
});

const emailTypeToTemplateId: Record<EmailType, number> = {
  // https://my.sendinblue.com/camp/template/10/message-setup
  NEW_CONVENTION_ADMIN_NOTIFICATION: 10, // v2

  // https://my.sendinblue.com/camp/template/27/message-setup
  NEW_CONVENTION_AGENCY_NOTIFICATION: 27,

  // https://my.sendinblue.com/camp/template/4/message-setup
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: 4, // v1

  // https://my.sendinblue.com/camp/template/5/message-setup
  NEW_CONVENTION_MENTOR_CONFIRMATION: 5, // v1

  // https://my.sendinblue.com/camp/template/6/message-setup
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: 6,

  // https://my.sendinblue.com/camp/template/9/message-setup
  REJECTED_CONVENTION_NOTIFICATION: 9,

  // https://my.sendinblue.com/camp/template/13/message-setup
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: 13,

  // https://my.sendinblue.com/camp/template/11/message-setup
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: 11,

  // https://my.sendinblue.com/camp/template/14/message-setup
  MAGIC_LINK_RENEWAL: 14,

  // https://my.sendinblue.com/camp/template/15/message-setup
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: 15,

  // https://my.sendinblue.com/camp/template/16/message-setup
  BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION: 16, // EXISTING_SIGNATURE_NAME, MISSING_SIGNATURE_NAME

  // https://my.sendinblue.com/camp/template/18/message-setup
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE: 18,

  // https://my.sendinblue.com/camp/template/19/message-setup
  NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE: 19,

  // https://my.sendinblue.com/camp/template/20/message-setup
  CONTACT_BY_EMAIL_REQUEST: 20,

  // https://my.sendinblue.com/camp/template/21/message-setup
  CONTACT_BY_PHONE_INSTRUCTIONS: 21,

  // https://my.sendinblue.com/camp/template/22/message-setup
  CONTACT_IN_PERSON_INSTRUCTIONS: 22,

  // https://my.sendinblue.com/camp/template/24/message-setup
  SHARE_DRAFT_CONVENTION_BY_LINK: 24,

  // https://my.sendinblue.com/camp/template/25/message-setup
  EDIT_FORM_ESTABLISHMENT_LINK: 25,

  // https://my.sendinblue.com/camp/template/26/message-setup
  SUGGEST_EDIT_FORM_ESTABLISHMENT: 26,

  // https://my.sendinblue.com/camp/template/41/message-setup
  CREATE_IMMERSION_ASSESSMENT: 41,

  // https://my.sendinblue.com/camp/template/39/message-setup
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: 39,

  // https://my.sendinblue.com/camp/template/42/message-setup
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: 42,

  // https://my.sendinblue.com/camp/template/42/message-setup
  AGENCY_WAS_ACTIVATED: 48,
};

export class SendinblueEmailGateway implements EmailGateway {
  private constructor(
    private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi,
    private readonly emailAllowListPredicate: (recipient: string) => boolean,
  ) {}

  public static create(
    apiKey: string,
    emailAllowListPredicate: (recipient: string) => boolean,
  ): SendinblueEmailGateway {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );

    return new SendinblueEmailGateway(apiInstance, emailAllowListPredicate);
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
    await this.sendTransacEmail(
      "CREATE_IMMERSION_ASSESSMENT",
      [recipient],
      {
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        MENTOR_NAME: params.mentorName,
        IMMERSION_ASSESSMENT_CREATION_LINK:
          params.immersionAssessmentCreationLink,
      },
      [],
    );
  }

  public async sendFormEstablishmentEditionSuggestion(
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ): Promise<void> {
    await this.sendTransacEmail(
      "SUGGEST_EDIT_FORM_ESTABLISHMENT",
      [recipient],
      {
        EDIT_FRONT_LINK: params.editFrontUrl,
      },
      copy,
    );
  }

  public async sendRequestedEditFormEstablishmentLink(
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ): Promise<void> {
    await this.sendTransacEmail(
      "EDIT_FORM_ESTABLISHMENT_LINK",
      [recipient],
      {
        EDIT_FRONT_LINK: params.editFrontUrl,
      },
      copy,
    );
  }

  public async sendNewEstablishmentContactConfirmation(
    recipient: string,
    copy: string[],
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
      [recipient],
      {
        CONTACT_FIRST_NAME: formEstablishmentDto.businessContact.firstName,
        CONTACT_LAST_NAME: formEstablishmentDto.businessContact.lastName,
        BUSINESS_NAME: formEstablishmentDto.businessName,
      },
      copy,
    );
  }

  public async sendNewConventionBeneficiaryConfirmation(
    recipient: string,
    params: NewConventionBeneficiaryConfirmationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_CONVENTION_BENEFICIARY_CONFIRMATION",
      [recipient],
      {
        DEMANDE_ID: params.demandeId,
        FIRST_NAME: params.firstName,
        LAST_NAME: params.lastName,
      },
    );
  }

  public async sendNewConventionMentorConfirmation(
    recipient: string,
    params: NewConventionMentorConfirmationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_CONVENTION_MENTOR_CONFIRMATION",
      [recipient],
      {
        DEMANDE_ID: params.demandeId,
        MENTOR_NAME: params.mentorName,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
      },
    );
  }

  public async sendNewConventionAdminNotification(
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ) {
    await this.sendTransacEmail(
      "NEW_CONVENTION_ADMIN_NOTIFICATION",
      recipients,
      {
        DEMANDE_ID: params.demandeId,
        FIRST_NAME: params.firstName,
        LAST_NAME: params.lastName,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        BUSINESS_NAME: params.businessName,
        AGENCY_NAME: params.agencyName,
        MAGIC_LINK: params.magicLink,
      },
    );
  }

  public async sendNewConventionAgencyNotification(
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ) {
    await this.sendTransacEmail(
      "NEW_CONVENTION_AGENCY_NOTIFICATION",
      recipients,
      {
        DEMANDE_ID: params.demandeId,
        FIRST_NAME: params.firstName,
        LAST_NAME: params.lastName,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        BUSINESS_NAME: params.businessName,
        AGENCY_NAME: params.agencyName,
        MAGIC_LINK: params.magicLink,
      },
    );
  }

  public async sendValidatedConventionFinalConfirmation(
    recipients: string[],
    params: ValidatedConventionFinalConfirmationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients,
      {
        TOTAL_HOURS: params.totalHours,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        EMERGENCY_CONTACT: params.emergencyContact,
        EMERGENCY_CONTACT_PHONE: params.emergencyContactPhone,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        MENTOR_NAME: params.mentorName,
        SCHEDULE_LINES: params.scheduleText.split("\n"),
        BUSINESS_NAME: params.businessName,
        IMMERSION_ADDRESS: params.immersionAddress,
        IMMERSION_PROFESSION: params.immersionAppellationLabel,
        IMMERSION_ACTIVITIES: params.immersionActivities,
        IMMERSION_SKILLS: params.immersionSkills,
        SANITARY_PREVENTION_DESCRIPTION: params.sanitaryPrevention,
        INDIVIDUAL_PROTECTION: params.individualProtection,
        QUESTIONNAIRE_URL: params.questionnaireUrl,
        SIGNATURE: params.signature,
        WORK_CONDITIONS: params.workConditions,
      },
    );
  }

  public async sendRejectedConventionNotification(
    recipients: string[],
    params: RejectedConventionNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "REJECTED_CONVENTION_NOTIFICATION",
      recipients,
      {
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        REASON: params.rejectionReason,
        AGENCY: params.agency,
        SIGNATURE: params.signature,
      },
    );
  }

  public async sendConventionModificationRequestNotification(
    recipients: string[],
    params: ConventionModificationRequestNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
      recipients,
      {
        AGENCY: params.agency,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        REASON: params.reason,
        SIGNATURE: params.signature,
        URL: params.magicLink,
      },
    );
  }

  public async sendNewConventionForReviewNotification(
    recipients: string[],
    params: NewConventionReviewForEligibilityOrValidationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
      recipients,
      {
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        MAGIC_LINK: params.magicLink,
        POSSIBLE_ROLE_ACTION: params.possibleRoleAction,
      },
    );
  }

  public async sendRenewedMagicLink(
    recipients: string[],
    params: SendRenewedMagicLinkParams,
  ): Promise<void> {
    await this.sendTransacEmail("MAGIC_LINK_RENEWAL", recipients, {
      MAGIC_LINK: params.magicLink,
    });
  }

  public async sendSignedByOtherPartyNotification(
    recipient: string,
    params: SignedByOtherPartyNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
      [recipient],
      {
        FIRST_NAME: params.beneficiaryFirstName,
        LAST_NAME: params.beneficiaryLastName,
        IMMERSION_PROFESSION: params.immersionProfession,
        COMPANY_NAME: params.businessName,
        MENTOR: params.mentor,
        EXISTING_SIGNATURE_NAME: params.existingSignatureName,
        MAGIC_LINK: params.magicLink,
      },
    );
  }

  public async sendBeneficiarySignatureRequestNotification(
    recipient: string,
    params: BeneficiarySignatureRequestNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
      [recipient],
      {
        MAGIC_LINK: params.magicLink,
        FIRST_NAME: params.beneficiaryFirstName,
        LAST_NAME: params.beneficiaryLastName,
        COMPANY_NAME: params.businessName,
      },
    );
  }

  public async sendEnterpriseSignatureRequestNotification(
    recipient: string,
    params: EnterpriseSignatureRequestNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
      [recipient],
      {
        MAGIC_LINK: params.magicLink,
        FIRST_NAME: params.beneficiaryFirstName,
        LAST_NAME: params.beneficiaryLastName,
        COMPANY_NAME: params.businessName,
        MENTOR_NAME: params.mentorName,
      },
    );
  }

  public async sendContactByEmailRequest(
    recipient: string,
    copy: string[],
    params: ContactByEmailRequestParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "CONTACT_BY_EMAIL_REQUEST",
      [recipient],
      {
        BUSINESS_NAME: params.businessName,
        CONTACT_FIRSTNAME: params.contactFirstName,
        CONTACT_LASTNAME: params.contactLastName,
        JOB_LABEL: params.jobLabel,
        POTENTIAL_BENEFICIARY_FIRSTNAME: params.potentialBeneficiaryFirstName,
        POTENTIAL_BENEFICIARY_LASTNAME: params.potentialBeneficiaryLastName,
        POTENTIAL_BENEFICIARY_EMAIL: params.potentialBeneficiaryEmail,
        MESSAGE: params.message,
      },
      copy,
    );
  }

  public async sendContactByPhoneInstructions(
    recipient: string,
    params: ContactByPhoneInstructionsParams,
  ): Promise<void> {
    await this.sendTransacEmail("CONTACT_BY_PHONE_INSTRUCTIONS", [recipient], {
      BUSINESS_NAME: params.businessName,
      CONTACT_FIRSTNAME: params.contactFirstName,
      CONTACT_LASTNAME: params.contactLastName,
      CONTACT_PHONE: params.contactPhone,
      POTENTIAL_BENEFICIARY_FIRSTNAME: params.potentialBeneficiaryFirstName,
      POTENTIAL_BENEFICIARY_LASTNAME: params.potentialBeneficiaryLastName,
    });
  }

  public async sendContactInPersonInstructions(
    recipient: string,
    params: ContactInPersonInstructionsParams,
  ): Promise<void> {
    await this.sendTransacEmail("CONTACT_IN_PERSON_INSTRUCTIONS", [recipient], {
      BUSINESS_NAME: params.businessName,
      CONTACT_FIRSTNAME: params.contactFirstName,
      CONTACT_LASTNAME: params.contactLastName,
      BUSINESS_ADDRESS: params.businessAddress,
      POTENTIAL_BENEFICIARY_FIRSTNAME: params.potentialBeneficiaryFirstName,
      POTENTIAL_BENEFICIARY_LASTNAME: params.potentialBeneficiaryLastName,
    });
  }

  public async sendShareDraftConventionByLink(
    recipient: string,
    params: ShareDraftConventionByLinkParams,
  ): Promise<void> {
    await this.sendTransacEmail("SHARE_DRAFT_CONVENTION_BY_LINK", [recipient], {
      ADDITIONAL_DETAILS: params.additionalDetails,
      APPLICATION_FORM_LINK: params.conventionFormUrl,
    });
  }

  public async sendToPoleEmploiAdvisorOnConventionAssociation(
    recipient: string,
    params: PoleEmploiAdvisorOnConventionAssociationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
      [recipient],
      {
        ADVISOR_FIRST_NAME: params.advisorFirstName,
        ADVISOR_LAST_NAME: params.advisorLastName,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BENEFICIARY_EMAIL: params.beneficiaryEmail,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        BUSINESS_NAME: params.businessName,
        IMMERSION_ADDRESS: params.immersionAddress,
        MAGIC_LINK: params.magicLink,
      },
    );
  }

  public async sendToPoleEmploiAdvisorOnConventionFullySigned(
    recipient: string,
    params: PoleEmploiAdvisorOnConventionFullysignedParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
      [recipient],
      {
        ADVISOR_FIRST_NAME: params.advisorFirstName,
        ADVISOR_LAST_NAME: params.advisorLastName,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BENEFICIARY_EMAIL: params.beneficiaryEmail,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        BUSINESS_NAME: params.businessName,
        IMMERSION_ADDRESS: params.immersionAddress,
        MAGIC_LINK: params.magicLink,
      },
    );
  }

  public async sendAgencyWasActivated(
    recipients: string[],
    params: AgencyWasActivatedParams,
  ): Promise<void> {
    await this.sendTransacEmail("AGENCY_WAS_ACTIVATED", recipients, {
      AGENCY_NAME: params.agencyName,
    });
  }

  private async sendTransacEmail(
    emailType: EmailType,
    recipients: string[],
    params: any,
    carbonCopy: string[] = [],
  ) {
    const filteredRecipients = recipients
      .filter(this.emailAllowListPredicate)
      .map((email): SendSmtpEmailTo => ({ email }));
    if (filteredRecipients.length === 0) return;

    const filteredCarbonCopy: string[] = carbonCopy.filter(
      this.emailAllowListPredicate,
    );

    const baseEmailConfig: SendSmtpEmail = {
      templateId: emailTypeToTemplateId[emailType],
      to: filteredRecipients,
      params,
    };

    const fullEmailConfig = addCarbonCopyFieldIfNeeded(
      baseEmailConfig,
      filteredCarbonCopy,
    );

    try {
      counterSendTransactEmailTotal.inc({ emailType });
      logger.info({ fullEmailConfig }, "Sending email");

      const data = await this.apiInstance.sendTransacEmail(fullEmailConfig);

      counterSendTransactEmailSuccess.inc({ emailType });
      logger.info(data, "Email sending succeeded");
    } catch (error: any) {
      counterSendTransactEmailError.inc({ emailType });
      logger.error(error, "Email sending failed");
      notifyObjectDiscord({
        _message: `Email ${emailType} sending failed`,
        recipients: recipients.join("; "),
        body: JSON.stringify(error?.body, null, 2),
        response: JSON.stringify(
          {
            statusCode: error?.response?.statusCode,
            body: error?.response?.body,
          },
          null,
          2,
        ),
      });
      throw error;
    }
  }
}

const addCarbonCopyFieldIfNeeded = (
  baseEmailConfig: SendSmtpEmail,
  carbonCopy: string[],
): SendSmtpEmail => {
  if (carbonCopy.length === 0) return baseEmailConfig;

  return {
    ...baseEmailConfig,
    cc: carbonCopy.map((email): SendSmtpEmailCc => ({ email })),
  };
};

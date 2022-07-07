import { EmailSentDto } from "shared/email";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

export type NewConventionAdminNotificationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
  agencyName: string;
  magicLink: string;
};

export type NewConventionBeneficiaryConfirmationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
};

export type NewConventionMentorConfirmationParams = {
  demandeId: string;
  mentorName: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
};

export type ValidatedConventionFinalConfirmationParams = {
  totalHours: number;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  dateStart: string;
  dateEnd: string;
  mentorName: string;
  scheduleText: string;
  businessName: string;
  immersionAddress: string;
  immersionAppellationLabel: string;
  immersionActivities: string;
  immersionSkills: string;
  sanitaryPrevention: string;
  individualProtection: string;
  questionnaireUrl: string;
  signature: string;
  workConditions?: string;
};

export type PoleEmploiAdvisorOnConventionFullysignedParams = {
  advisorFirstName: string;
  advisorLastName: string;
  immersionAddress: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  beneficiaryEmail: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
  magicLink: string;
};

export type PoleEmploiAdvisorOnConventionAssociationParams = {
  advisorFirstName: string;
  advisorLastName: string;
  //advisorType: string;
  immersionAddress: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  beneficiaryEmail: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
  magicLink: string;
};

export type RejectedConventionNotificationParams = {
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  rejectionReason: string;
  businessName: string;
  signature: string;
  immersionProfession: string;
  agency: string;
};

export type ConventionModificationRequestNotificationParams = {
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  reason: string;
  businessName: string;
  signature: string;
  immersionAppellation: AppellationDto;
  agency: string;
  magicLink: string;
};

export type NewConventionReviewForEligibilityOrValidationParams = {
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  businessName: string;
  magicLink: string;
  possibleRoleAction: string;
};

export type SendRenewedMagicLinkParams = {
  magicLink: string;
};

// For BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION
export type SignedByOtherPartyNotificationParams = {
  magicLink: string;
  existingSignatureName: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  immersionProfession: string;
  businessName: string;
  mentor: string;
};

// NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE
export type BeneficiarySignatureRequestNotificationParams = {
  beneficiaryFirstName: string; //< FIRST_NAME
  beneficiaryLastName: string; //< LAST_NAME
  magicLink: string; //< MAGIC_LINK
  businessName: string; //< COMPANY_NAME
};

// NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE
export type EnterpriseSignatureRequestNotificationParams = {
  beneficiaryFirstName: string; //< FIRST_NAME
  beneficiaryLastName: string; //< LAST_NAME
  mentorName: string; //< MENTOR_NAME
  magicLink: string; //< MAGIC_LINK
  businessName: string; //< COMPANY_NAME
};

// CONTACT_BY_EMAIL_REQUEST
export type ContactByEmailRequestParams = {
  businessName: string; //< BUSINESS_NAME
  contactFirstName: string; //< CONTACT_FIRSTNAME
  contactLastName: string; //< CONTACT_LASTNAME
  jobLabel: string; //< JOB_LABEL
  potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
  potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
  potentialBeneficiaryEmail: string; //< POTENTIAL_BENEFICIARY_EMAIL
  message: string; //< MESSAGE
};

// CONTACT_BY_PHONE_INSTRUCTIONS
export type ContactByPhoneInstructionsParams = {
  businessName: string; //< BUSINESS_NAME
  contactFirstName: string; //< CONTACT_FIRSTNAME
  contactLastName: string; //< CONTACT_LASTNAME
  contactPhone: string; //< CONTACT_PHONE
  potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
  potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
};

// CONTACT_IN_PERSON_INSTRUCTIONS
export type ContactInPersonInstructionsParams = {
  businessName: string; //< BUSINESS_NAME
  contactFirstName: string; //< CONTACT_FIRSTNAME
  contactLastName: string; //< CONTACT_LASTNAME
  businessAddress: string; //< BUSINESS_ADDRESS
  potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
  potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
};

// SHARE_DRAFT_APPLICATION_BY_LINK
export type ShareDraftConventionByLinkParams = {
  additionalDetails: string; //< ADDITIONAL_DETAILS
  conventionFormUrl: string; //< APPLICATION_FORM_LINK
};

// AGENCY_WAS_ACTIVATED
export type AgencyWasActivatedParams = {
  agencyName: string;
};

export interface EmailGateway {
  getLastSentEmailDtos: () => EmailSentDto[];
  sendImmersionAssessmentCreationLink: (
    recipient: string,
    params: {
      beneficiaryFirstName: string;
      beneficiaryLastName: string;
      mentorName: string;
      immersionAssessmentCreationLink: string;
    },
  ) => Promise<void>;
  sendRequestedEditFormEstablishmentLink: (
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ) => Promise<void>;
  sendFormEstablishmentEditionSuggestion: (
    recipient: string,
    copy: string[],
    params: { editFrontUrl: string },
  ) => Promise<void>;
  sendNewConventionBeneficiaryConfirmation: (
    recipient: string,
    params: NewConventionBeneficiaryConfirmationParams,
  ) => Promise<void>;
  sendNewEstablishmentContactConfirmation: (
    recipients: string,
    copy: string[],
    params: FormEstablishmentDto,
  ) => Promise<void>;
  sendNewConventionMentorConfirmation: (
    recipient: string,
    params: NewConventionMentorConfirmationParams,
  ) => Promise<void>;
  sendNewConventionAdminNotification: (
    recipients: string[],
    params: NewConventionAdminNotificationParams,
  ) => Promise<void>;
  sendNewConventionAgencyNotification: (
    recipient: string[],
    params: NewConventionAdminNotificationParams,
  ) => Promise<void>;
  sendValidatedConventionFinalConfirmation: (
    recipient: string[],
    params: ValidatedConventionFinalConfirmationParams,
  ) => Promise<void>;
  sendRejectedConventionNotification: (
    recipient: string[],
    params: RejectedConventionNotificationParams,
  ) => Promise<void>;
  sendConventionModificationRequestNotification: (
    recipient: string[],
    params: ConventionModificationRequestNotificationParams,
  ) => Promise<void>;
  sendNewConventionForReviewNotification: (
    recipient: string[],
    params: NewConventionReviewForEligibilityOrValidationParams,
  ) => Promise<void>;
  sendToPoleEmploiAdvisorOnConventionAssociation: (
    recipient: string,
    params: PoleEmploiAdvisorOnConventionAssociationParams,
  ) => Promise<void>;
  sendToPoleEmploiAdvisorOnConventionFullySigned: (
    recipient: string,
    params: PoleEmploiAdvisorOnConventionFullysignedParams,
  ) => Promise<void>;
  sendRenewedMagicLink: (
    recipient: string[],
    params: SendRenewedMagicLinkParams,
  ) => Promise<void>;
  sendSignedByOtherPartyNotification: (
    recipient: string,
    params: SignedByOtherPartyNotificationParams,
  ) => Promise<void>;
  sendBeneficiarySignatureRequestNotification: (
    recipient: string,
    params: BeneficiarySignatureRequestNotificationParams,
  ) => Promise<void>;
  sendEnterpriseSignatureRequestNotification: (
    recipient: string,
    params: EnterpriseSignatureRequestNotificationParams,
  ) => Promise<void>;
  sendContactByEmailRequest: (
    recipient: string,
    copy: string[],
    params: ContactByEmailRequestParams,
  ) => Promise<void>;
  sendContactByPhoneInstructions: (
    recipient: string,
    params: ContactByPhoneInstructionsParams,
  ) => Promise<void>;
  sendContactInPersonInstructions: (
    recipient: string,
    params: ContactInPersonInstructionsParams,
  ) => Promise<void>;
  sendShareDraftConventionByLink: (
    recipient: string,
    params: ShareDraftConventionByLinkParams,
  ) => Promise<void>;
  sendAgencyWasActivated: (
    recipients: string[],
    params: AgencyWasActivatedParams,
  ) => Promise<void>;
}

import { FormEstablishmentDto } from "../../../shared/formEstablishment/FormEstablishment.dto";
import { AppellationDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";

export type NewApplicationAdminNotificationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
  agencyName: string;
  magicLink: string;
};

export type NewApplicationBeneficiaryConfirmationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
};

export type NewApplicationMentorConfirmationParams = {
  demandeId: string;
  mentorName: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
};

export type ValidatedApplicationFinalConfirmationParams = {
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
  sanitaryPrevention: string;
  individualProtection: string;
  questionnaireUrl: string;
  signature: string;
  workConditions?: string;
};

export type RejectedApplicationNotificationParams = {
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  rejectionReason: string;
  businessName: string;
  signature: string;
  immersionProfession: string;
  agency: string;
};

export type ModificationRequestApplicationNotificationParams = {
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  reason: string;
  businessName: string;
  signature: string;
  immersionAppellation: AppellationDto;
  agency: string;
  magicLink: string;
};

export type NewImmersionApplicationReviewForEligibilityOrValidationParams = {
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

// NEW_APPLICATION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE
export type BeneficiarySignatureRequestNotificationParams = {
  beneficiaryFirstName: string; //< FIRST_NAME
  beneficiaryLastName: string; //< LAST_NAME
  magicLink: string; //< MAGIC_LINK
  businessName: string; //< COMPANY_NAME
};

// NEW_APPLICATION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE
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
export type ShareDraftApplicationByLinkParams = {
  additional_details: string; //< ADDITIONAL_DETAILS
  application_form_url: string; //< APPLICATION_FORM_LINK
};

export type EmailType =
  | "NEW_APPLICATION_BENEFICIARY_CONFIRMATION"
  | "NEW_APPLICATION_MENTOR_CONFIRMATION"
  | "NEW_APPLICATION_ADMIN_NOTIFICATION"
  | "NEW_APPLICATION_AGENCY_NOTIFICATION"
  | "NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION"
  | "VALIDATED_APPLICATION_FINAL_CONFIRMATION"
  | "REJECTED_APPLICATION_NOTIFICATION"
  | "MODIFICATION_REQUEST_APPLICATION_NOTIFICATION"
  | "MAGIC_LINK_RENEWAL"
  | "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION"
  | "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION"
  | "NEW_APPLICATION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE"
  | "NEW_APPLICATION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE"
  | "CONTACT_BY_EMAIL_REQUEST"
  | "CONTACT_BY_PHONE_INSTRUCTIONS"
  | "CONTACT_IN_PERSON_INSTRUCTIONS"
  | "EDIT_FORM_ESTABLISHMENT_LINK"
  | "SUGGEST_EDIT_FORM_ESTABLISHMENT"
  | "SHARE_DRAFT_APPLICATION_BY_LINK";

export interface EmailGateway {
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
  sendNewApplicationBeneficiaryConfirmation: (
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams,
  ) => Promise<void>;
  sendNewEstablismentContactConfirmation: (
    recipients: string,
    copy: string[],
    params: FormEstablishmentDto,
  ) => Promise<void>;
  sendNewApplicationMentorConfirmation: (
    recipient: string,
    params: NewApplicationMentorConfirmationParams,
  ) => Promise<void>;
  sendNewApplicationAdminNotification: (
    recipients: string[],
    params: NewApplicationAdminNotificationParams,
  ) => Promise<void>;
  sendNewApplicationAgencyNotification: (
    recipient: string[],
    params: NewApplicationAdminNotificationParams,
  ) => Promise<void>;
  sendValidatedApplicationFinalConfirmation: (
    recipient: string[],
    params: ValidatedApplicationFinalConfirmationParams,
  ) => Promise<void>;
  sendRejectedApplicationNotification: (
    recipient: string[],
    params: RejectedApplicationNotificationParams,
  ) => Promise<void>;
  sendModificationRequestApplicationNotification: (
    recipient: string[],
    params: ModificationRequestApplicationNotificationParams,
  ) => Promise<void>;
  sendNewApplicationForReviewNotification: (
    recipient: string[],
    params: NewImmersionApplicationReviewForEligibilityOrValidationParams,
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
  sendShareDraftApplicationByLink: (
    recipient: string,
    params: ShareDraftApplicationByLinkParams,
  ) => Promise<void>;
}

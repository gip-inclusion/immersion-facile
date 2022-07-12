import { AppellationDto } from "./src/romeAndAppellationDtos/romeAndAppellation.dto";

export type GenericTemplatedEmail<
  T extends string,
  P extends Record<string, unknown>,
> = {
  type: T;
  params: P;
  recipients: string[];
  cc?: string[];
};

export type EmailType = TemplatedEmail["type"];

export type EmailSentDto = {
  templatedEmail: TemplatedEmail;
  sentAt: string;
  error?: string;
};

export type TemplatedEmail =
  | NewConventionAdminNotificationEmail
  | NewConventionBeneficiaryConfirmationEmail
  | NewConventionMentorConfirmationEmail
  | ValidatedConventionFinalConfirmationEmail
  | PoleEmploiAdvisorOnConventionFullySignedEmail
  | PoleEmploiAdvisorOnConventionAssociationEmail
  | RejectedConventionNotificationEmail
  | ConventionModificationRequestNotificationEmail
  | NewConventionReviewForEligibilityOrValidationEmail
  | SendRenewedMagicLinkEmail
  | SignedByOtherPartyNotificationEmail
  | BeneficiarySignatureRequestNotificationEmail
  | EnterpriseSignatureRequestNotificationEmail
  | ContactByEmailRequestEmail
  | ContactByPhoneInstructionsEmail
  | ContactInPersonInstructionsEmail
  | ShareDraftConventionByLinkEmail
  | AgencyWasActivatedEmail;

type NewConventionAdminNotificationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_ADMIN_NOTIFICATION",
  {
    demandeId: string;
    firstName: string;
    lastName: string;
    dateStart: string;
    dateEnd: string;
    businessName: string;
    agencyName: string;
    magicLink: string;
  }
>;

type NewConventionBeneficiaryConfirmationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_BENEFICIARY_CONFIRMATION",
  {
    demandeId: string;
    firstName: string;
    lastName: string;
  }
>;

type NewConventionMentorConfirmationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_MENTOR_CONFIRMATION",
  {
    demandeId: string;
    mentorName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
  }
>;

type ValidatedConventionFinalConfirmationEmail = GenericTemplatedEmail<
  "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
  {
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
  }
>;

type PoleEmploiAdvisorOnConventionFullySignedEmail = GenericTemplatedEmail<
  "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
  {
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
  }
>;

type PoleEmploiAdvisorOnConventionAssociationEmail = GenericTemplatedEmail<
  "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
  {
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
  }
>;

type RejectedConventionNotificationEmail = GenericTemplatedEmail<
  "REJECTED_CONVENTION_NOTIFICATION",
  {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    rejectionReason: string;
    businessName: string;
    signature: string;
    immersionProfession: string;
    agency: string;
  }
>;

type ConventionModificationRequestNotificationEmail = GenericTemplatedEmail<
  "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
  {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    reason: string;
    businessName: string;
    signature: string;
    immersionAppellation: AppellationDto;
    agency: string;
    magicLink: string;
  }
>;

type NewConventionReviewForEligibilityOrValidationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
  {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    magicLink: string;
    possibleRoleAction: string;
  }
>;

type SendRenewedMagicLinkEmail = GenericTemplatedEmail<
  "MAGIC_LINK_RENEWAL",
  {
    magicLink: string;
  }
>;

type SignedByOtherPartyNotificationEmail = GenericTemplatedEmail<
  "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
  {
    magicLink: string;
    existingSignatureName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    immersionProfession: string;
    businessName: string;
    mentor: string;
  }
>;

type BeneficiarySignatureRequestNotificationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
  {
    beneficiaryFirstName: string; //< FIRST_NAME
    beneficiaryLastName: string; //< LAST_NAME
    magicLink: string; //< MAGIC_LINK
    businessName: string; //< COMPANY_NAME
  }
>;

type EnterpriseSignatureRequestNotificationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
  {
    beneficiaryFirstName: string; //< FIRST_NAME
    beneficiaryLastName: string; //< LAST_NAME
    mentorName: string; //< MENTOR_NAME
    magicLink: string; //< MAGIC_LINK
    businessName: string; //< COMPANY_NAME
  }
>;

type ContactByEmailRequestEmail = GenericTemplatedEmail<
  "CONTACT_BY_EMAIL_REQUEST",
  {
    businessName: string; //< BUSINESS_NAME
    contactFirstName: string; //< CONTACT_FIRSTNAME
    contactLastName: string; //< CONTACT_LASTNAME
    jobLabel: string; //< JOB_LABEL
    potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
    potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
    potentialBeneficiaryEmail: string; //< POTENTIAL_BENEFICIARY_EMAIL
    message: string; //< MESSAGE
  }
>;

type ContactByPhoneInstructionsEmail = GenericTemplatedEmail<
  "CONTACT_BY_PHONE_INSTRUCTIONS",
  {
    businessName: string; //< BUSINESS_NAME
    contactFirstName: string; //< CONTACT_FIRSTNAME
    contactLastName: string; //< CONTACT_LASTNAME
    contactPhone: string; //< CONTACT_PHONE
    potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
    potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
  }
>;

type ContactInPersonInstructionsEmail = GenericTemplatedEmail<
  "CONTACT_IN_PERSON_INSTRUCTIONS",
  {
    businessName: string; //< BUSINESS_NAME
    contactFirstName: string; //< CONTACT_FIRSTNAME
    contactLastName: string; //< CONTACT_LASTNAME
    businessAddress: string; //< BUSINESS_ADDRESS
    potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
    potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
  }
>;

type ShareDraftConventionByLinkEmail = GenericTemplatedEmail<
  "SHARE_DRAFT_CONVENTION_BY_LINK",
  {
    additionalDetails: string; //< ADDITIONAL_DETAILS
    conventionFormUrl: string; //< APPLICATION_FORM_LINK
  }
>;

type AgencyWasActivatedEmail = GenericTemplatedEmail<
  "AGENCY_WAS_ACTIVATED",
  {
    agencyName: string;
  }
>;

// export type EmailType =
//   | "NEW_CONVENTION_BENEFICIARY_CONFIRMATION"
//   | "NEW_CONVENTION_MENTOR_CONFIRMATION"
//   | "NEW_CONVENTION_ADMIN_NOTIFICATION"
//   | "NEW_CONVENTION_AGENCY_NOTIFICATION"
//   | "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION"
//   | "VALIDATED_CONVENTION_FINAL_CONFIRMATION"
//   | "REJECTED_CONVENTION_NOTIFICATION"
//   | "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION"
//   | "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION"
//   | "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED"
//   | "MAGIC_LINK_RENEWAL"
//   | "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION"
//   | "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION"
//   | "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE"
//   | "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE"
//   | "CONTACT_BY_EMAIL_REQUEST"
//   | "CONTACT_BY_PHONE_INSTRUCTIONS"
//   | "CONTACT_IN_PERSON_INSTRUCTIONS"
//   | "EDIT_FORM_ESTABLISHMENT_LINK"
//   | "SUGGEST_EDIT_FORM_ESTABLISHMENT"
//   | "SHARE_DRAFT_CONVENTION_BY_LINK"
//   | "CREATE_IMMERSION_ASSESSMENT"
//   | "AGENCY_WAS_ACTIVATED";

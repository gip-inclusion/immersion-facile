import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

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

type KeysOfUnion<T> = T extends T ? keyof T : never;
// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type EmailVariables = KeysOfUnion<TemplatedEmail["params"]>;

export type TemplatedEmail =
  | NewConventionBeneficiaryConfirmationEmail
  | NewConventionEstablishmentTutorConfirmationEmail
  | NewConventionAgencyNotificationEmail
  | ValidatedConventionFinalConfirmationEmail
  | PoleEmploiAdvisorOnConventionFullySignedEmail
  | PoleEmploiAdvisorOnConventionAssociationEmail
  | RejectedConventionNotificationEmail
  | ConventionModificationRequestNotificationEmail
  | NewConventionReviewForEligibilityOrValidationEmail
  | SendRenewedMagicLinkEmail
  | SignedByOtherPartyNotificationEmail
  | SignatorySignatureRequestNotificationEmail
  | ContactByEmailRequestEmail
  | ContactByPhoneInstructionsEmail
  | ContactInPersonInstructionsEmail
  | ShareDraftConventionByLinkEmail
  | AgencyWasActivatedEmail
  | FormEstablishmentEditionSuggestionEmail
  | EditFormEstablishmentLinkEmail
  | NewEstablishmentCreatedContactConfirmationEmail
  | CreatImmersionAssessmentEmail
  | FullPreviewEmail
  | SigneeHasSignedConvention;

export type SigneeHasSignedConvention = GenericTemplatedEmail<
  "SIGNEE_HAS_SIGNED_CONVENTION",
  {
    demandeId: string;
    signedAt: string;
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

type NewConventionAgencyNotificationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_AGENCY_NOTIFICATION",
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

type NewConventionEstablishmentTutorConfirmationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION",
  {
    demandeId: string;
    establishmentTutorName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
  }
>;

export type ValidatedConventionFinalConfirmationEmail = GenericTemplatedEmail<
  "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
  {
    totalHours: number;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    beneficiaryBirthdate: string;
    emergencyContact?: string;
    emergencyContactPhone?: string;
    dateStart: string;
    dateEnd: string;
    establishmentTutorName: string;
    establishmentRepresentativeName: string;
    beneficiaryRepresentativeName: string;
    beneficiaryCurrentEmployerName?: string;
    scheduleText: string[];
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
    agencyName: string;
    emergencyContactInfos?: string;
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
    justification: string;
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
  "BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION",
  {
    magicLink: string;
    existingSignatureName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    immersionProfession: string;
    businessName: string;
    establishmentRepresentativeName: string;
  }
>;

type SignatorySignatureRequestNotificationEmail = GenericTemplatedEmail<
  "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
  {
    beneficiaryName: string; //< BENEFICIARY_NAME
    establishmentRepresentativeName: string; //< MENTOR_NAME
    beneficiaryRepresentativeName?: string; //< LEGAL_REPRESENTATIVE_NAME
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string; //< SIGNATORY_NAME
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
    agencyLogoUrl?: string;
  }
>;

type EditFormEstablishmentLinkEmail = GenericTemplatedEmail<
  "EDIT_FORM_ESTABLISHMENT_LINK",
  {
    editFrontUrl: string;
  }
>;

type FormEstablishmentEditionSuggestionEmail = GenericTemplatedEmail<
  "SUGGEST_EDIT_FORM_ESTABLISHMENT",
  {
    editFrontUrl: string;
  }
>;

type NewEstablishmentCreatedContactConfirmationEmail = GenericTemplatedEmail<
  "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
  { contactFirstName: string; contactLastName: string; businessName: string }
>;

type CreatImmersionAssessmentEmail = GenericTemplatedEmail<
  "CREATE_IMMERSION_ASSESSMENT",
  {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    establishmentTutorName: string;
    immersionAssessmentCreationLink: string;
  }
>;

type FullPreviewEmail = GenericTemplatedEmail<
  "FULL_PREVIEW_EMAIL",
  {
    beneficiaryName: string; //< BENEFICIARY_NAME
    establishmentRepresentativeName: string; //< MENTOR_NAME
    beneficiaryRepresentativeName?: string; //< LEGAL_REPRESENTATIVE_NAME
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string; //< SIGNATORY_NAME
    magicLink: string; //< MAGIC_LINK
    businessName: string; //< COMPANY_NAME
  }
>;

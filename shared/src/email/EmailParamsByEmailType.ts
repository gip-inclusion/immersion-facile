import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type EmailParamsByEmailType = {
  SIGNEE_HAS_SIGNED_CONVENTION: {
    demandeId: string;
    signedAt: string;
  };
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    demandeId: string;
    firstName: string;
    lastName: string;
  };
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    demandeId: string;
    firstName: string;
    lastName: string;
    dateStart: string;
    dateEnd: string;
    businessName: string;
    agencyName: string;
    magicLink: string;
  };
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    demandeId: string;
    establishmentTutorName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
  };
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    totalHours: number;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
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
    emergencyContactInfos: string;
    beneficiaryBirthdate: string;
  };
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
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
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
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
  REJECTED_CONVENTION_NOTIFICATION: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    rejectionReason: string;
    businessName: string;
    signature: string;
    immersionProfession: string;
    agency: string;
  };
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    justification: string;
    businessName: string;
    signature: string;
    immersionAppellation: AppellationDto;
    agency: string;
    magicLink: string;
  };
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    magicLink: string;
    possibleRoleAction: string;
  };
  MAGIC_LINK_RENEWAL: {
    magicLink: string;
  };
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    magicLink: string;
    existingSignatureName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    immersionProfession: string;
    businessName: string;
    establishmentRepresentativeName: string;
  };
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    beneficiaryName: string; //< BENEFICIARY_NAME
    establishmentRepresentativeName: string; //< MENTOR_NAME
    beneficiaryRepresentativeName?: string; //< LEGAL_REPRESENTATIVE_NAME
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string; //< SIGNATORY_NAME
    magicLink: string; //< MAGIC_LINK
    businessName: string; //< COMPANY_NAME
  };
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: string; //< BUSINESS_NAME
    contactFirstName: string; //< CONTACT_FIRSTNAME
    contactLastName: string; //< CONTACT_LASTNAME
    jobLabel: string; //< JOB_LABEL
    potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
    potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
    potentialBeneficiaryEmail: string; //< POTENTIAL_BENEFICIARY_EMAIL
    message: string; //< MESSAGE
  };
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    businessName: string; //< BUSINESS_NAME
    contactFirstName: string; //< CONTACT_FIRSTNAME
    contactLastName: string; //< CONTACT_LASTNAME
    contactPhone: string; //< CONTACT_PHONE
    potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
    potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
  };
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    businessName: string; //< BUSINESS_NAME
    contactFirstName: string; //< CONTACT_FIRSTNAME
    contactLastName: string; //< CONTACT_LASTNAME
    businessAddress: string; //< BUSINESS_ADDRESS
    potentialBeneficiaryFirstName: string; //< POTENTIAL_BENEFICIARY_FIRSTNAME
    potentialBeneficiaryLastName: string; //< POTENTIAL_BENEFICIARY_LASTNAME
  };
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    additionalDetails: string; //< ADDITIONAL_DETAILS
    conventionFormUrl: string; //< APPLICATION_FORM_LINK
  };
  AGENCY_WAS_ACTIVATED: {
    agencyName: string;
    agencyLogoUrl?: string;
  };
  EDIT_FORM_ESTABLISHMENT_LINK: {
    editFrontUrl: string;
  };
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    editFrontUrl: string;
  };
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    contactFirstName: string;
    contactLastName: string;
    businessName: string;
  };
  CREATE_IMMERSION_ASSESSMENT: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    establishmentTutorName: string;
    immersionAssessmentCreationLink: string;
  };
  FULL_PREVIEW_EMAIL: {
    beneficiaryName: string; //< BENEFICIARY_NAME
    establishmentRepresentativeName: string; //< MENTOR_NAME
    beneficiaryRepresentativeName?: string; //< LEGAL_REPRESENTATIVE_NAME
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string; //< SIGNATORY_NAME
    magicLink: string; //< MAGIC_LINK
    businessName: string; //< COMPANY_NAME
  };
};

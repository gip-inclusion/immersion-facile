import { InternshipKind } from "../convention/convention.dto";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type EmailParamsByEmailType = {
  SIGNEE_HAS_SIGNED_CONVENTION: {
    internshipKind: InternshipKind;
    demandeId: string;
    signedAt: string;
    conventionStatusLink: string;
    agencyLogoUrl: string | undefined;
  };
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    internshipKind: InternshipKind;
    demandeId: string;
    firstName: string;
    lastName: string;
    agencyLogoUrl: string | undefined;
  };
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    internshipKind: InternshipKind;
    demandeId: string;
    firstName: string;
    lastName: string;
    dateStart: string;
    dateEnd: string;
    businessName: string;
    agencyName: string;
    magicLink: string;
    conventionStatusLink: string;
    agencyLogoUrl: string | undefined;
  };
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    internshipKind: InternshipKind;
    demandeId: string;
    establishmentTutorName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    agencyLogoUrl: string | undefined;
  };
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    internshipKind: InternshipKind;
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
    agencyLogoUrl: string | undefined;
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
    agencyLogoUrl: string | undefined;
  };
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
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
    agencyLogoUrl: string | undefined;
  };
  REJECTED_CONVENTION_NOTIFICATION: {
    internshipKind: InternshipKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    rejectionReason: string;
    businessName: string;
    signature: string;
    immersionProfession: string;
    agency: string;
    agencyLogoUrl: string | undefined;
  };
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    internshipKind: InternshipKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    justification: string;
    businessName: string;
    signature: string;
    immersionAppellation: AppellationDto;
    agency: string;
    magicLink: string;
    conventionStatusLink: string;
    agencyLogoUrl: string | undefined;
  };
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    internshipKind: InternshipKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    magicLink: string;
    conventionStatusLink: string;
    possibleRoleAction: string;
    agencyLogoUrl: string | undefined;
  };
  MAGIC_LINK_RENEWAL: {
    internshipKind: InternshipKind;
    magicLink: string;
    conventionStatusLink: string;
  };
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    internshipKind: InternshipKind;
    magicLink: string;
    conventionStatusLink: string;
    existingSignatureName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    immersionProfession: string;
    businessName: string;
    establishmentRepresentativeName: string;
    agencyLogoUrl: string | undefined;
  };
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    internshipKind: InternshipKind;
    beneficiaryName: string;
    establishmentRepresentativeName: string;
    beneficiaryRepresentativeName?: string;
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string;
    magicLink: string;
    conventionStatusLink: string;
    businessName: string;
    agencyLogoUrl: string | undefined;
  };
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: string;
    contactFirstName: string;
    contactLastName: string;
    jobLabel: string;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
    potentialBeneficiaryEmail: string;
    message: string;
  };
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    businessName: string;
    contactFirstName: string;
    contactLastName: string;
    contactPhone: string;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
  };
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    businessName: string;
    contactFirstName: string;
    contactLastName: string;
    businessAddress: string;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
  };
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    internshipKind: InternshipKind;
    additionalDetails: string;
    conventionFormUrl: string;
  };
  AGENCY_WAS_ACTIVATED: {
    agencyName: string;
    agencyLogoUrl: string | undefined;
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
    internshipKind: InternshipKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    establishmentTutorName: string;
    immersionAssessmentCreationLink: string;
    agencyLogoUrl: string | undefined;
  };
  FULL_PREVIEW_EMAIL: {
    internshipKind: InternshipKind;
    beneficiaryName: string;
    establishmentRepresentativeName: string;
    beneficiaryRepresentativeName?: string;
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string;
    magicLink: string;
    conventionStatusLink: string;
    businessName: string;
    agencyLogoUrl: string | undefined;
  };
};

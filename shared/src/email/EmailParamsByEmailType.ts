import { AbsoluteUrl } from "../AbsoluteUrl";
import { InternshipKind } from "../convention/convention.dto";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type EmailParamsByEmailType = {
  SIGNEE_HAS_SIGNED_CONVENTION: {
    internshipKind: InternshipKind;
    demandeId: string;
    signedAt: string;
    conventionStatusLink: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    internshipKind: InternshipKind;
    demandeId: string;
    firstName: string;
    lastName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
    warning?: string;
  };
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    internshipKind: InternshipKind;
    demandeId: string;
    establishmentTutorName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    internshipKind: InternshipKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    dateStart: string;
    dateEnd: string;
    establishmentTutorName: string;
    businessName: string;
    immersionAppellationLabel: string;
    emergencyContactInfos: string;
    beneficiaryBirthdate: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    magicLink: string;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    internshipKind: InternshipKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    magicLink: string;
    conventionStatusLink: string;
    possibleRoleAction: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    internshipKind: InternshipKind;
    beneficiaryName: string;
    establishmentRepresentativeName: string;
    establishmentTutorName: string;
    beneficiaryRepresentativeName?: string;
    beneficiaryCurrentEmployerName?: string;
    signatoryName: string;
    magicLink: string;
    conventionStatusLink: string;
    businessName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: string;
    contactFirstName: string;
    contactLastName: string;
    appellationLabel: string;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
    agencyValidatorEmail: string;
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
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
};

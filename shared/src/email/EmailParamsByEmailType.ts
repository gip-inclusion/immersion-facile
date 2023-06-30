import { AbsoluteUrl } from "../AbsoluteUrl";
import {
  ConventionId,
  ImmersionObjective,
  InternshipKind,
} from "../convention/convention.dto";

export type EmailParamsByEmailType = {
  AGENCY_FIRST_REMINDER: {
    agencyMagicLinkUrl: string;
    agencyName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    conventionId: ConventionId;
    businessName: string;
    dateStart: string;
    dateEnd: string;
  };
  AGENCY_LAST_REMINDER: {
    agencyMagicLinkUrl: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
  };
  AGENCY_WAS_ACTIVATED: {
    agencyName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    establishmentRepresentativeName: string;
    existingSignatureName: string;
    immersionProfession: string;
    internshipKind: InternshipKind;
    magicLink: string;
  };
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: string;
    businessAddress: string;
    contactFirstName: string;
    contactLastName: string;
    appellationLabel: string;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
    potentialBeneficiaryPhone: string;
    immersionObjective: ImmersionObjective | null;
    potentialBeneficiaryResumeLink?: string;
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
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    internshipKind: InternshipKind;
    justification: string;
    magicLink: string;
    signature: string;
  };
  CREATE_IMMERSION_ASSESSMENT: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    agencyValidatorEmail: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    conventionId: ConventionId;
    establishmentTutorName: string;
    immersionAssessmentCreationLink: string;
    internshipKind: InternshipKind;
  };
  DEPRECATED_CONVENTION_NOTIFICATION: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    deprecationReason: string;
    dateEnd: string;
    dateStart: string;
    immersionProfession: string;
    internshipKind: InternshipKind;
  };
  DISCUSSION_EXCHANGE: {
    subject: string;
    htmlContent: string;
  };
  EDIT_FORM_ESTABLISHMENT_LINK: {
    editFrontUrl: string;
    businessName: string;
    businessAddress: string;
  };
  FULL_PREVIEW_EMAIL: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    internshipKind: InternshipKind;
  };
  IC_USER_RIGHTS_HAS_CHANGED: {
    agencyName: string;
  };
  MAGIC_LINK_RENEWAL: {
    conventionId: ConventionId | undefined;
    conventionStatusLink: string;
    internshipKind: InternshipKind;
    magicLink: string;
  };
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    agencyName: string;
    businessName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    dateEnd: string;
    dateStart: string;
    internshipKind: InternshipKind;
    firstName: string;
    lastName: string;
    magicLink: AbsoluteUrl;
    warning?: string;
  };
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    conventionId: ConventionId;
    internshipKind: InternshipKind;
    firstName: string;
    lastName: string;
  };
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryName: string;
    beneficiaryRepresentativeName?: string;
    beneficiaryCurrentEmployerName?: string;
    businessName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    establishmentRepresentativeName: string;
    establishmentTutorName: string;
    internshipKind: InternshipKind;
    conventionSignShortlink: string;
    signatoryName: string;
  };
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    conventionSignShortlink: AbsoluteUrl;
    internshipKind: InternshipKind;
    justification: string;
    signatoryFirstName: string;
    signatoryLastName: string;
  };
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    conventionId: ConventionId;
    establishmentTutorName: string;
    internshipKind: InternshipKind;
  };
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    internshipKind: InternshipKind;
    magicLink: string;
    possibleRoleAction: string;
  };
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    contactFirstName: string;
    contactLastName: string;
    businessName: string;
    businessAddress: string;
  };
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    advisorFirstName: string;
    advisorLastName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    beneficiaryEmail: string;
    businessName: string;
    conventionId: ConventionId;
    dateEnd: string;
    dateStart: string;
    immersionAddress: string;
    magicLink: string;
  };
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    advisorFirstName: string;
    advisorLastName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    beneficiaryEmail: string;
    businessName: string;
    conventionId: ConventionId;
    dateEnd: string;
    dateStart: string;
    immersionAddress: string;
    magicLink: string;
  };
  REJECTED_CONVENTION_NOTIFICATION: {
    agencyName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    immersionProfession: string;
    internshipKind: InternshipKind;
    rejectionReason: string;
    signature: string;
  };
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    internshipKind: InternshipKind;
    additionalDetails: string;
    conventionFormUrl: string;
  };
  SIGNATORY_FIRST_REMINDER: {
    actorFirstName: string;
    actorLastName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    magicLinkUrl: AbsoluteUrl | undefined;
    signatoriesSummary: string;
  };
  SIGNATORY_LAST_REMINDER: {
    actorFirstName: string;
    actorLastName: string;
    businessName: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    conventionId: ConventionId;
    magicLinkUrl: AbsoluteUrl | undefined;
    signatoriesSummary: string;
  };
  SIGNEE_HAS_SIGNED_CONVENTION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    conventionId: ConventionId;
    conventionStatusLink: AbsoluteUrl;
    internshipKind: InternshipKind;
    signedAt: string;
  };
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    editFrontUrl: string;
    businessName: string;
    businessAddress: string;
  };
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryBirthdate: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    dateStart: string;
    dateEnd: string;
    emergencyContactInfos: string;
    establishmentTutorName: string;
    immersionAppellationLabel: string;
    internshipKind: InternshipKind;
    magicLink: string;
  };
};

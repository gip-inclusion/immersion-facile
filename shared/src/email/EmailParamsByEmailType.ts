import type { AbsoluteUrl } from "../AbsoluteUrl";
import type {
  AssessmentDtoCompleted,
  AssessmentDtoPartiallyCompleted,
} from "../assessment/assessment.dto";
import type {
  ConventionId,
  ImmersionObjective,
  InternshipKind,
  Renewed,
} from "../convention/convention.dto";
import type {
  ContactLevelOfEducation,
  DiscussionExchangeForbiddenParams,
  DiscussionKind,
  ExchangeRole,
} from "../discussion/discussion.dto";
import type { AgencyRole, EstablishmentRole } from "../role/role.dto";
import type { AppellationLabel } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { DateString } from "../utils/date";
import type { Email } from "./email.dto";

export type UserParamsForMail = {
  agencyName: string;
  isNotifiedByEmail: boolean;
  roles: AgencyRole[];
  firstName: string;
  lastName: string;
  email: Email;
};

export type EmailParamsByEmailType = {
  AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION: {
    firstName: string;
    lastName: string;
    immersionBaseUrl: AbsoluteUrl;
    agencies: {
      agencyName: string;
      numberOfUsersToReview: number;
    }[];
  };
  AGENCY_DELEGATION_CONTACT_INFORMATION: {
    firstName: string;
    lastName: string;
    agencyName: string;
    agencyProvince: string;
    delegationProviderMail: string;
  };
  AGENCY_FIRST_REMINDER: {
    agencyMagicLinkUrl: string;
    agencyName: string;
    agencyReferentName: string | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    conventionId: ConventionId;
    businessName: string;
    dateStart: string;
    dateEnd: string;
  };
  AGENCY_LAST_REMINDER: {
    agencyMagicLinkUrl: string;
    agencyReferentName: string | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
  };
  AGENCY_OF_TYPE_OTHER_ADDED: {
    agencyName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
  };
  AGENCY_WAS_ACTIVATED: {
    agencyName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    users: UserParamsForMail[];
    agencyReferdToName: string | undefined;
    refersToOtherAgency: boolean;
  };
  AGENCY_WAS_REJECTED: {
    agencyName: string;
    statusJustification: string;
  };
  AGENCY_WITH_REFERS_TO_ACTIVATED: {
    nameOfAgencyRefering: string;
    refersToAgencyName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    validatorEmails: string[];
  };
  ASSESSMENT_AGENCY_NOTIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    agencyReferentName: string | undefined;
    manageConventionLink: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    tutorEmail: string;
    businessName: string;
    conventionId: ConventionId;
    internshipKind: InternshipKind;
  };
  ASSESSMENT_BENEFICIARY_NOTIFICATION: {
    conventionId: ConventionId;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    internshipKind: InternshipKind;
    establishmentTutorEmail: Email;
  };
  ASSESSMENT_CREATED_BENEFICIARY_NOTIFICATION: {
    internshipKind: InternshipKind;
    conventionId: ConventionId;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    magicLink: string;
  };
  ASSESSMENT_CREATED_ESTABLISHMENT_NOTIFICATION: {
    recipientFullName: string;
    beneficiaryFullName: string;
    businessName: string;
    linkToAssessment: AbsoluteUrl;
    internshipKind: InternshipKind;
  };
  ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION: {
    agencyReferentName: string | undefined;
    immersionObjective: ImmersionObjective | undefined;
    conventionId: ConventionId;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionDateEnd: DateString;
    internshipKind: InternshipKind;
    assessment: AssessmentDtoCompleted | AssessmentDtoPartiallyCompleted;
    immersionAppellationLabel: string;
    numberOfHoursMade: string;
    magicLink: string;
  };
  ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION: {
    agencyReferentName: string | undefined;
    immersionObjective: ImmersionObjective | undefined;
    conventionId: ConventionId;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    internshipKind: InternshipKind;
    immersionAppellationLabel: string;
  };
  ASSESSMENT_ESTABLISHMENT_NOTIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    assessmentCreationLink: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    conventionId: ConventionId;
    establishmentTutorName: string;
    internshipKind: InternshipKind;
  };
  ASSESSMENT_ESTABLISHMENT_REMINDER: {
    assessmentCreationLink: string;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    establishmentTutorFirstName: string;
    establishmentTutorLastName: string;
    conventionId: ConventionId;
    internshipKind: InternshipKind;
  };
  CANCELLED_CONVENTION_NOTIFICATION: {
    agencyName: string;
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    immersionProfession: string;
    internshipKind: InternshipKind;
    signature: string;
    dateEnd: string;
    dateStart: string;
    justification: string;
  };
  CONTACT_BY_EMAIL_CANDIDATE_CONFIRMATION: {
    kind: DiscussionKind;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
  };
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: string;
    businessAddress: string;
    appellationLabel: string;
    immersionObjective: ImmersionObjective | undefined;
    replyToEmail: Email;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
    potentialBeneficiaryPhone: string;
    potentialBeneficiaryDatePreferences: string;
    discussionUrl: AbsoluteUrl;
  } & (
    | {
        kind: "IF";
        potentialBeneficiaryExperienceAdditionalInformation?: string;
        potentialBeneficiaryResumeLink?: string;
      }
    | {
        kind: "1_ELEVE_1_STAGE";
        levelOfEducation: ContactLevelOfEducation;
      }
  );
  CONTACT_BY_EMAIL_REQUEST_LEGACY: {
    businessName: string;
    businessAddress: string;
    appellationLabel: string;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
    potentialBeneficiaryPhone: string;
    immersionObjective: ImmersionObjective | undefined;
    potentialBeneficiaryResumeLink?: string;
    message: string;
    replyToEmail: Email;
  };
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    businessName: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactPhone: string;
    kind: DiscussionKind;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
  };
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    businessName: string;
    contactFirstName?: string;
    contactLastName?: string;
    welcomeAddress: string;
    kind: DiscussionKind;
    potentialBeneficiaryFirstName: string;
    potentialBeneficiaryLastName: string;
  };
  CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION: {
    previousAgencyName: string;
    justification: string;
    magicLink: string;
    conventionId: ConventionId;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    beneficiaryEmail: string;
    beneficiaryPhone: string;
    internshipKind: InternshipKind;
  };
  CONVENTION_TRANSFERRED_SIGNATORY_NOTIFICATION: {
    internshipKind: InternshipKind;
    immersionProfession: string;
    previousAgencyName: string;
    newAgencyName: string;
    agencyAddress: string;
    businessName: string;
    justification: string;
    magicLink: string;
    conventionId: ConventionId;
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
  DISCUSSION_BENEFICIARY_FOLLOW_UP: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    contactFirstName: string;
    contactLastName: string;
    contactJob: string | undefined;
    contactPhone: string;
  };
  DISCUSSION_DEPRECATED_NOTIFICATION_BENEFICIARY: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    discussionCreatedAt: string;
    searchPageUrl: string;
  };
  DISCUSSION_DEPRECATED_NOTIFICATION_ESTABLISHMENT: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    discussionCreatedAt: string;
    establishmentDashboardUrl: AbsoluteUrl;
  };
  DISCUSSION_EXCHANGE: {
    subject: string;
    htmlContent: string;
    sender: ExchangeRole;
  };
  DISCUSSION_EXCHANGE_FORBIDDEN: DiscussionExchangeForbiddenParams;
  ESTABLISHMENT_CONTACT_REQUEST_REMINDER: {
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    beneficiaryReplyToEmail: string;
    appellationLabel: AppellationLabel;
    domain: string;
    mode: "3days" | "7days";
  };
  ESTABLISHMENT_DELETED: {
    businessName: string;
    siret: SiretDto;
    businessAddresses: string[];
  };
  ESTABLISHMENT_LEAD_REMINDER: {
    businessName: string;
    registerEstablishmentShortLink: string;
    unsubscribeToEmailShortLink: string;
  };
  ESTABLISHMENT_USER_RIGHTS_ADDED: {
    businessName: string;
    firstName: string;
    lastName: string;
    triggeredByUserFirstName: string;
    triggeredByUserLastName: string;
    role: EstablishmentRole;
    immersionBaseUrl: AbsoluteUrl;
  };
  ESTABLISHMENT_USER_RIGHTS_UPDATED: {
    businessName: string;
    firstName: string;
    lastName: string;
    triggeredByUserFirstName: string;
    triggeredByUserLastName: string;
    updatedRole: EstablishmentRole;
  };
  FULL_PREVIEW_EMAIL: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryName: string;
    conventionId: ConventionId;
    conventionStatusLink: string;
    internshipKind: InternshipKind;
  };
  IC_USER_REGISTRATION_TO_AGENCY_REJECTED: {
    agencyName: string;
    justification: string;
  };
  IC_USER_RIGHTS_HAS_CHANGED: UserParamsForMail;
  LOGIN_BY_EMAIL_REQUESTED: {
    fullname?: string;
    loginLink: AbsoluteUrl;
  };
  MAGIC_LINK_RENEWAL: {
    conventionId: ConventionId | undefined;
    internshipKind: InternshipKind;
    magicLink: string;
  };
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    agencyName: string;
    agencyReferentName: string | undefined;
    businessName: string;
    conventionId: ConventionId;
    dateEnd: string;
    dateStart: string;
    internshipKind: InternshipKind;
    firstName: string;
    lastName: string;
    magicLink: AbsoluteUrl;
    warning?: string;
  };
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    beneficiaryName: string;
    beneficiaryRepresentativeName?: string;
    beneficiaryCurrentEmployerName?: string;
    businessName: string;
    conventionId: ConventionId;
    establishmentRepresentativeName: string;
    establishmentTutorName: string;
    internshipKind: InternshipKind;
    conventionSignShortlink: string;
    signatoryName: string;
    renewed?: Renewed;
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
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    agencyLogoUrl: AbsoluteUrl | undefined;
    agencyReferentName: string | undefined;
    beneficiaryFirstName: string;
    beneficiaryLastName: string;
    businessName: string;
    conventionId: ConventionId;
    internshipKind: InternshipKind;
    magicLink: string;
    possibleRoleAction: string;
    validatorName: string;
    peAdvisor:
      | {
          recipientIsPeAdvisor: boolean;
          firstName: string;
          lastName: string;
          email: string;
        }
      | undefined;
  };
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    businessName: string;
    businessAddresses: string[];
    appelationLabels: string[];
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
  SIGNATORY_REMINDER: {
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
    magicLink: AbsoluteUrl;
    internshipKind: InternshipKind;
    signedAt: string;
    agencyName: string;
  };
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    editFrontUrl: AbsoluteUrl;
    businessName: string;
    businessAddresses: string[];
  };
  TEST_EMAIL: {
    input1: string;
    input2: string;
    url: AbsoluteUrl;
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
    assessmentMagicLink: string | undefined;
    validatorName: string;
  };
  WARN_DISCUSSION_DELIVERY_FAILED: {
    recipientsInEmailInError: string[];
    errorMessage: string;
  };
};

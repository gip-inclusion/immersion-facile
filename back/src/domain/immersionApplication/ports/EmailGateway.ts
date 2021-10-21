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
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  dateStart: string;
  dateEnd: string;
  mentorName: string;
  scheduleText: string;
  businessName: string;
  immersionAddress: string;
  immersionProfession: string;
  immersionActivities: string;
  sanitaryPrevention: string;
  individualProtection: string;
  questionnaireUrl: string;
  signature: string;
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
  immersionProfession: string;
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

export type EmailType =
  | "NEW_APPLICATION_BENEFICIARY_CONFIRMATION"
  | "NEW_APPLICATION_MENTOR_CONFIRMATION"
  | "NEW_APPLICATION_ADMIN_NOTIFICATION"
  | "NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION"
  | "VALIDATED_APPLICATION_FINAL_CONFIRMATION"
  | "REJECTED_APPLICATION_NOTIFICATION"
  | "MODIFICATION_REQUEST_APPLICATION_NOTIFICATION";

export interface EmailGateway {
  sendNewApplicationBeneficiaryConfirmation: (
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams,
  ) => Promise<void>;
  sendNewApplicationMentorConfirmation: (
    recipient: string,
    params: NewApplicationMentorConfirmationParams,
  ) => Promise<void>;
  sendNewApplicationAdminNotification: (
    recipients: string[],
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
}

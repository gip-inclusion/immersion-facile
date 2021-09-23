export type NewApplicationAdminNotificationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
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

export type EmailType =
  | "NEW_APPLICATION_BENEFICIARY_CONFIRMATION"
  | "NEW_APPLICATION_MENTOR_CONFIRMATION"
  | "NEW_APPLICATION_ADMIN_NOTIFICATION"
  | "VALIDATED_APPLICATION_FINAL_CONFIRMATION";

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
}

export type NewDemandeAdminNotificationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
};

export type NewDemandeBeneficiaireConfirmationParams = {
  demandeId: string;
  firstName: string;
  lastName: string;
};

export type EmailType =
  | "NEW_DEMANDE_BENEFICIAIRE_CONFIRMATION"
  | "NEW_DEMANDE_ADMIN_NOTIFICATION";

export interface EmailGateway {
  sendNewDemandeBeneficiaireConfirmation: (
    recipient: string,
    params: NewDemandeBeneficiaireConfirmationParams
  ) => Promise<void>;
  sendNewDemandeAdminNotification: (
    recipients: string[],
    params: NewDemandeAdminNotificationParams
  ) => Promise<void>;
}

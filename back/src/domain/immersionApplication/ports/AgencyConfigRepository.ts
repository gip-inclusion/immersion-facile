import { AgencyCode } from "../../../shared/agencies";

export type AgencyConfig = {
  counsellorEmails: string[];
  adminEmails: string[];
  allowUnrestrictedEmailSending: boolean;
  questionnaireUrl: string;
  signature: string;
};

export interface AgencyRepository {
  getConfig: (agencyCode: AgencyCode) => Promise<AgencyConfig | undefined>;
}

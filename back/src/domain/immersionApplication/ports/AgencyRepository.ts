import { AgencyId } from "../../../shared/agencies";

export type AgencyConfig = {
  id: AgencyId;
  name: string;
  counsellorEmails: string[];
  validatorEmails: string[];
  adminEmails: string[];
  questionnaireUrl: string;
  signature: string;
};

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getAll: () => Promise<AgencyConfig[]>;
}

import { AgencyId } from "../../../shared/agencies";
import { Position } from "../../immersionOffer/ports/AdresseAPI";

export type AgencyConfig = {
  id: AgencyId;
  name: string;
  counsellorEmails: string[];
  validatorEmails: string[];
  adminEmails: string[];
  questionnaireUrl: string;
  signature: string;
  position: Position;
};

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getAll: () => Promise<AgencyConfig[]>;
}

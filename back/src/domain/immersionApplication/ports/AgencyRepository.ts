import { AgencyId } from "../../../shared/agencies";
import { LatLonDto } from "../../../shared/SearchImmersionDto";

export type AgencyConfig = {
  id: AgencyId;
  name: string;
  counsellorEmails: string[];
  validatorEmails: string[];
  adminEmails: string[];
  questionnaireUrl: string;
  signature: string;
  position: LatLonDto;
};

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getNearby: (position: LatLonDto) => Promise<AgencyConfig[]>;
  getAll: () => Promise<AgencyConfig[]>;
}

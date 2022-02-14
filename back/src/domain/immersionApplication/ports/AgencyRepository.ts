import { AgencyId, CreateAgencyConfig } from "../../../shared/agencies";
import { LatLonDto } from "../../../shared/SearchImmersionDto";

export type AgencyConfig = CreateAgencyConfig & {
  adminEmails: string[];
};

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getNearby: (position: LatLonDto) => Promise<AgencyConfig[]>;
  getAll: () => Promise<AgencyConfig[]>;
}

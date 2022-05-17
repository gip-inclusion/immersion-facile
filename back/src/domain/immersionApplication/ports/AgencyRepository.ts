import { AgencyConfig, AgencyId } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  update: (config: AgencyConfig) => Promise<void>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getImmersionFacileIdByKind: () => Promise<AgencyId>;
  getNearby: (
    position: LatLonDto,
    distance_km: number,
  ) => Promise<AgencyConfig[]>;
  getAgencyWhereEmailMatches: (
    email: string,
  ) => Promise<AgencyConfig | undefined>;
  getAllActive: () => Promise<AgencyConfig[]>;
}

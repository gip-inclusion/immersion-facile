import { AgencyConfig, AgencyId } from "../../../shared/agency/agency.dto";
import { LatLonDto } from "../../../shared/latLon";

export interface AgencyRepository {
  insert: (config: AgencyConfig) => Promise<AgencyId | undefined>;
  getById: (id: AgencyId) => Promise<AgencyConfig | undefined>;
  getImmersionFacileIdByKind: () => Promise<AgencyId>;
  getNearby: (position: LatLonDto) => Promise<AgencyConfig[]>;
  getAllActive: () => Promise<AgencyConfig[]>;
}

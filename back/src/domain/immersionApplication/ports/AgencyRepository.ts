import { Agency, AgencyId } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyRepository {
  insert: (config: Agency) => Promise<AgencyId | undefined>;
  update: (config: Agency) => Promise<void>;
  getById: (id: AgencyId) => Promise<Agency | undefined>;
  getImmersionFacileIdByKind: () => Promise<AgencyId>;
  getNearby: (position: LatLonDto, distance_km: number) => Promise<Agency[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<Agency | undefined>;
  getAllActive: () => Promise<Agency[]>;
}

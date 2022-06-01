import { AgencyDto, AgencyId } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyRepository {
  insert: (config: AgencyDto) => Promise<AgencyId | undefined>;
  update: (config: AgencyDto) => Promise<void>;
  getById: (id: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileIdByKind: () => Promise<AgencyId>;
  getNearby: (position: LatLonDto, distance_km: number) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
  getAllActive: () => Promise<AgencyDto[]>;
}

import {
  AgencyDto,
  AgencyId,
  AgencyKindFilter,
} from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export interface AgencyRepository {
  insert: (config: AgencyDto) => Promise<AgencyId | undefined>;
  update: (config: AgencyDto) => Promise<void>;
  getById: (id: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileIdByKind: () => Promise<AgencyId>;
  getAllActiveNearby: (
    position: LatLonDto,
    distance_km: number,
    agencyKindFilter?: AgencyKindFilter,
  ) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
  getAllActive: (agencyKindFilter?: AgencyKindFilter) => Promise<AgencyDto[]>;
}

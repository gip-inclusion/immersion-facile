import {
  AgencyDto,
  AgencyId,
  GetAgenciesFilter,
} from "shared/src/agency/agency.dto";

export interface AgencyRepository {
  insert: (config: AgencyDto) => Promise<AgencyId | undefined>;
  update: (config: AgencyDto) => Promise<void>;
  getById: (id: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileIdByKind: () => Promise<AgencyId>;
  getAgencies: (props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
}

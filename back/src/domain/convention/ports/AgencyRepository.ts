import {
  AgencyDto,
  AgencyId,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";

export interface AgencyRepository {
  insert: (config: AgencyDto) => Promise<AgencyId | undefined>;
  update: (config: PartialAgencyDto) => Promise<void>;
  getById: (id: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileAgencyId: () => Promise<AgencyId>;
  getAgencies: (props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
}

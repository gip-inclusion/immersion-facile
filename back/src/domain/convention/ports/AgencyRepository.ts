import {
  AgencyDto,
  AgencyId,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";

export interface AgencyRepository {
  insert: (config: AgencyDto) => Promise<AgencyId | undefined>;
  update: (config: PartialAgencyDto) => Promise<void>;
  getByIds: (ids: AgencyId[]) => Promise<AgencyDto[]>;
  getById: (ids: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileAgencyId: () => Promise<AgencyId | undefined>;
  getAgencies: (props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
}

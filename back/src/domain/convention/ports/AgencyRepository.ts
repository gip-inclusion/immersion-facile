import {
  AgencyDto,
  AgencyId,
  GetAgenciesFilter,
  PartialAgencySaveParams,
  SaveAgencyParams,
} from "shared";

export interface AgencyRepository {
  insert: (agency: SaveAgencyParams) => Promise<AgencyId | undefined>;
  update: (partialAgency: PartialAgencySaveParams) => Promise<void>;
  getByIds: (ids: AgencyId[]) => Promise<AgencyDto[]>;
  getById: (ids: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileAgencyId: () => Promise<AgencyId | undefined>;
  getAgencies: (props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
}

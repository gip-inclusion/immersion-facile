import {
  AgencyDto,
  AgencyId,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";

export interface AgencyRepository {
  insert: (agency: AgencyDto) => Promise<AgencyId | undefined>;
  update: (partialAgency: PartialAgencyDto) => Promise<void>;
  getByIds: (ids: AgencyId[]) => Promise<AgencyDto[]>;
  getById: (ids: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileAgencyId: () => Promise<AgencyId | undefined>;
  getAgencies: (props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;
}

export const someAgenciesMissingMessage = (agencyIds: AgencyId[]) =>
  `Some agencies not found with ids : ${agencyIds.map((id) => `'${id}'`)}.`;
export const referedAgencyMissingMessage = (refersToAgencyId: AgencyId) =>
  `Refered agency with id '${refersToAgencyId}' missing on agency repository.`;

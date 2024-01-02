import {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";

export interface AgencyRepository {
  insert: (agency: AgencyDto) => Promise<AgencyId | undefined>;
  update: (partialAgency: PartialAgencyDto) => Promise<void>;
  getByIds: (ids: AgencyId[]) => Promise<AgencyDto[]>;
  getById: (id: AgencyId) => Promise<AgencyDto | undefined>;
  getImmersionFacileAgencyId: () => Promise<AgencyId | undefined>;
  getAgencies: (props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }) => Promise<AgencyDto[]>;
  getAgencyWhereEmailMatches: (email: string) => Promise<AgencyDto | undefined>;

  getBySafir(safirCode: string): Promise<AgencyDto | undefined>;

  getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyDto[]>;
  alreadyHasActiveAgencyWithSameAddressAndKind(params: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean>;
}

export const someAgenciesMissingMessage = (agencyIds: AgencyId[]) =>
  `Some agencies not found with ids : ${agencyIds.map((id) => `'${id}'`)}.`;
export const referedAgencyMissingMessage = (refersToAgencyId: AgencyId) =>
  `Refered agency with id '${refersToAgencyId}' missing on agency repository.`;
export const agencyMissingMessage = (agencyId: AgencyId): string =>
  `Agency with id '${agencyId}' missing.`;

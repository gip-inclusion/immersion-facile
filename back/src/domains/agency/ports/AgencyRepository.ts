import {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";

export interface AgencyRepository {
  alreadyHasActiveAgencyWithSameAddressAndKind(params: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean>;
  getAgencies(props: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }): Promise<AgencyDto[]>;
  getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyDto[]>;
  getById(id: AgencyId): Promise<AgencyDto | undefined>;
  getByIds(ids: AgencyId[]): Promise<AgencyDto[]>;
  getBySafir(safirCode: string): Promise<AgencyDto | undefined>;
  getImmersionFacileAgencyId(): Promise<AgencyId | undefined>;
  insert(agency: AgencyDto): Promise<AgencyId | undefined>;
  update(partialAgency: PartialAgencyDto): Promise<void>;
}

export const someAgenciesMissingMessage = (agencyIds: AgencyId[]) =>
  `Some agencies not found with ids : ${agencyIds.map((id) => `'${id}'`)}.`;
export const referedAgencyMissingMessage = (refersToAgencyId: AgencyId) =>
  `Refered agency with id '${refersToAgencyId}' missing on agency repository.`;
export const agencyMissingMessage = (agencyId: AgencyId): string =>
  `Agency with id '${agencyId}' not found.`;

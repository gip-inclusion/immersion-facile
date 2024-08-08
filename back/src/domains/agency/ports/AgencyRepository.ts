import type {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyPositionFilter,
  AgencyStatus,
  DepartmentCode,
  PartialAgencyDto,
  SiretDto,
} from "shared";

export type GetAgenciesFilters = {
  nameIncludes?: string;
  position?: AgencyPositionFilter;
  departmentCode?: DepartmentCode;
  kinds?: AgencyKind[];
  status?: AgencyStatus[];
  siret?: SiretDto;
  doesNotReferToOtherAgency?: true;
};

export interface AgencyRepository {
  alreadyHasActiveAgencyWithSameAddressAndKind(params: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean>;
  getAgencies(props: {
    filters?: GetAgenciesFilters;
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

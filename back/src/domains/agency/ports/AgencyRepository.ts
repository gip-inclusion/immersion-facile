import type {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyPositionFilter,
  AgencyRight,
  AgencyStatus,
  DepartmentCode,
  SiretDto,
  UserId,
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

export type AgencyWithoutRights = Omit<
  AgencyDto,
  "counsellorEmails" | "validatorEmails"
>;

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

  insert(agency: AgencyWithoutRights): Promise<AgencyId | undefined>;
  update(partialAgency: AgencyWithoutRights): Promise<void>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  getAgenciesRightsByUserId(id: UserId): Promise<AgencyRight[]>;
}

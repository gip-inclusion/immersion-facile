import type {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyPositionFilter,
  AgencyRight,
  AgencyRole,
  AgencyStatus,
  DepartmentCode,
  OmitFromExistingKeys,
  SiretDto,
  UserId,
  WithUserFilters,
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

export type UsersAgencyRights = Record<UserId, AgencyRight[]>;

export type PartialAgencyWithUsersRights = Partial<AgencyWithUsersRights> & {
  id: AgencyId;
};
export type AgencyRightWithAgencyWithUsersRights = OmitFromExistingKeys<
  AgencyRight,
  "agency"
> & { agency: AgencyWithUsersRights };

export type AgencyUserRight = {
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

export type AgencyUsersRights = Record<UserId, AgencyUserRight>;

export type WithAgencyUserRights = {
  usersRights: AgencyUsersRights;
};

export type AgencyWithUsersRights = OmitFromExistingKeys<
  AgencyDto,
  "counsellorEmails" | "validatorEmails"
> &
  WithAgencyUserRights;

export interface AgencyRepository {
  alreadyHasActiveAgencyWithSameAddressAndKind(params: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean>;
  getAgencies(props: {
    filters?: GetAgenciesFilters;
    limit?: number;
  }): Promise<AgencyWithUsersRights[]>;
  getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyWithUsersRights[]>;
  getById(id: AgencyId): Promise<AgencyWithUsersRights | undefined>;
  getByIds(ids: AgencyId[]): Promise<AgencyWithUsersRights[]>;
  getBySafir(safirCode: string): Promise<AgencyWithUsersRights | undefined>;
  getImmersionFacileAgencyId(): Promise<AgencyId | undefined>;
  insert(agency: AgencyWithUsersRights): Promise<AgencyId | undefined>;
  update(partialAgency: PartialAgencyWithUsersRights): Promise<void>;
  getAgenciesRightsByUserId(
    id: UserId,
  ): Promise<AgencyRightWithAgencyWithUsersRights[]>;
  getUserIdByFilters(filters: WithUserFilters): Promise<UserId[]>;
}

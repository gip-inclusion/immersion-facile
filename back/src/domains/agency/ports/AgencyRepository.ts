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
import { errors } from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
export type AgencyRightOfUser = OmitFromExistingKeys<AgencyRight, "agency"> & {
  agencyId: AgencyId;
};

export type AgencyUserRight = {
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

export type AgencyUsersRights = Partial<Record<UserId, AgencyUserRight>>;

export type WithAgencyUserRights = {
  usersRights: AgencyUsersRights;
};

export type AgencyWithUsersRights = OmitFromExistingKeys<
  AgencyDto,
  "counsellorEmails" | "validatorEmails"
> &
  WithAgencyUserRights;

export interface AgencyRepository {
  insert(agency: AgencyWithUsersRights): Promise<AgencyId | undefined>;
  update(partialAgency: PartialAgencyWithUsersRights): Promise<void>;

  getById(id: AgencyId): Promise<AgencyWithUsersRights | undefined>;
  getBySafir(safirCode: string): Promise<AgencyWithUsersRights | undefined>;
  getByIds(ids: AgencyId[]): Promise<AgencyWithUsersRights[]>;
  getAgencies(props: {
    filters?: GetAgenciesFilters;
    limit?: number;
  }): Promise<AgencyWithUsersRights[]>;

  getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyWithUsersRights[]>;

  getImmersionFacileAgencyId(): Promise<AgencyId | undefined>;
  getUserIdWithAgencyRightsByFilters(
    filters: WithUserFilters,
  ): Promise<UserId[]>;
  getAgenciesRightsByUserId(id: UserId): Promise<AgencyRightOfUser[]>;
  alreadyHasActiveAgencyWithSameAddressAndKind(params: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean>;
}

export const updateAgencyRightsForUser = async (
  uow: UnitOfWork,
  userId: UserId,
  { agencyId, isNotifiedByEmail, roles }: AgencyRightOfUser,
): Promise<void> => {
  const agencyWithRights = await uow.agencyRepository.getById(agencyId);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
  return uow.agencyRepository.update({
    id: agencyId,
    usersRights: {
      ...agencyWithRights.usersRights,
      [userId]: { isNotifiedByEmail, roles },
    },
  });
};

export const removeAgencyRightsForUser = async (
  uow: UnitOfWork,
  userId: UserId,
  { agencyId }: AgencyRightOfUser,
): Promise<void> => {
  const agencyWithRights = await uow.agencyRepository.getById(agencyId);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
  const { [userId]: _, ...rightsToKeep } = agencyWithRights.usersRights;
  return uow.agencyRepository.update({
    id: agencyId,
    usersRights: rightsToKeep,
  });
};

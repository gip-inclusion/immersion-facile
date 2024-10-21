import {
  type AddressDto,
  type AgencyDto,
  type AgencyId,
  type AgencyKind,
  type AgencyPositionFilter,
  type AgencyRight,
  type AgencyRole,
  type AgencyStatus,
  type DepartmentCode,
  type OmitFromExistingKeys,
  type SiretDto,
  type UserId,
  type WithUserFilters,
  errors,
} from "shared";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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

export const updateAgencyRightsForUser = async (
  uow: UnitOfWork,
  userId: UserId,
  { agency, isNotifiedByEmail, roles }: AgencyRightWithAgencyWithUsersRights,
): Promise<void> => {
  const agencyWithRights = await uow.agencyRepository.getById(agency.id);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId: agency.id });
  return uow.agencyRepository.update({
    id: agency.id,
    usersRights: {
      ...agencyWithRights.usersRights,
      [userId]: { isNotifiedByEmail, roles },
    },
  });
};

export const removeAgencyRightsForUser = async (
  uow: UnitOfWork,
  userId: UserId,
  { agency }: AgencyRightWithAgencyWithUsersRights,
): Promise<void> => {
  const agencyWithRights = await uow.agencyRepository.getById(agency.id);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId: agency.id });
  const { [userId]: _, ...rightsToKeep } = agencyWithRights.usersRights;
  return uow.agencyRepository.update({
    id: agency.id,
    usersRights: rightsToKeep,
  });
};

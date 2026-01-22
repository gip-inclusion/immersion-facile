import type {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyPositionFilter,
  AgencyRight,
  AgencyStatus,
  AgencyWithUsersRights,
  DateString,
  DepartmentCode,
  OmitFromExistingKeys,
  SiretDto,
  UserId,
  WithUserFilters,
} from "shared";
import { errors } from "shared";
import type { PhoneNumberRepository } from "../../core/phone-number/ports/PhoneNumberRepository";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export type GetAgenciesFilters = {
  nameIncludes?: string;
  position?: AgencyPositionFilter;
  departmentCode?: DepartmentCode;
  kinds?: AgencyKind[];
  status?: AgencyStatus[];
  sirets?: SiretDto[];
  doesNotReferToOtherAgency?: true;
  createdAtBefore?: Date;
};

export type AgencyWithoutRights = Omit<
  AgencyDto,
  "counsellorEmails" | "validatorEmails"
>;

export type PartialAgencyWithUsersRights = Partial<AgencyWithUsersRights> & {
  id: AgencyId;
};
export type AgencyRightForUser = OmitFromExistingKeys<AgencyRight, "agency"> & {
  agencyId: AgencyId;
};

export type AgencyWithNumberOfUsersToReview = {
  agency: AgencyWithUsersRights;
  numberOfUsersToReview: number;
};

export interface AgencyRepository {
  insert(params: {
    agency: AgencyWithUsersRights;
    phoneId: number;
    updatedAt?: DateString;
  }): Promise<void>;
  update(params: {
    partialAgency: PartialAgencyWithUsersRights;
    newPhoneId?: number;
  }): Promise<void>;

  getById(id: AgencyId): Promise<AgencyWithUsersRights | undefined>;
  getBySafirAndActiveStatus(
    safirCode: string,
  ): Promise<AgencyWithUsersRights[]>;
  getByIds(ids: AgencyId[]): Promise<AgencyWithUsersRights[]>;
  getAgencies(props: {
    filters?: GetAgenciesFilters;
    limit?: number;
  }): Promise<AgencyWithUsersRights[]>;

  getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyWithUsersRights[]>;
  getAllAgenciesWithUsersToReview(): Promise<AgencyWithNumberOfUsersToReview[]>;
  getImmersionFacileAgencyId(): Promise<AgencyId | undefined>;
  getUserIdWithAgencyRightsByFilters(
    filters: WithUserFilters,
  ): Promise<UserId[]>;
  getAgenciesRightsByUserId(id: UserId): Promise<AgencyRightForUser[]>;
  alreadyHasActiveAgencyWithSameAddressAndKind(params: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean>;
  getExistingActiveSirets(sirets: SiretDto[]): Promise<SiretDto[]>;
  deleteOldClosedAgenciesWithoutConventions(params: {
    updatedBefore: Date;
  }): Promise<AgencyId[]>;
}

export const updateAgencyRightsForUser = async (
  uow: UnitOfWork,
  params: {
    userId: UserId;
    agencyRightForUser: AgencyRightForUser;
  },
): Promise<void> => {
  const { userId, agencyRightForUser } = params;
  const { agencyId, isNotifiedByEmail, roles } = agencyRightForUser;
  const agencyWithRights = await uow.agencyRepository.getById(agencyId);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
  return uow.agencyRepository.update({
    partialAgency: {
      id: agencyId,
      usersRights: {
        ...agencyWithRights.usersRights,
        [userId]: { isNotifiedByEmail, roles },
      },
    },
  });
};

export const removeAgencyRightsForUser = async (
  uow: UnitOfWork,
  params: {
    userId: UserId;
    agencyRightForUser: AgencyRightForUser;
  },
): Promise<void> => {
  const { userId, agencyRightForUser } = params;
  const { agencyId } = agencyRightForUser;
  const agencyWithRights = await uow.agencyRepository.getById(agencyId);
  if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
  const { [userId]: _, ...rightsToKeep } = agencyWithRights.usersRights;
  return uow.agencyRepository.update({
    partialAgency: {
      id: agencyId,
      usersRights: rightsToKeep,
    },
  });
};

export const toAgencyInsertParams = async (
  agency: AgencyWithUsersRights,
  phoneNumberRepository: PhoneNumberRepository,
  timeGateway: TimeGateway,
  updatedAt?: DateString,
): Promise<{
  agency: AgencyWithUsersRights;
  phoneId: number;
  updatedAt?: DateString;
}> => {
  return {
    agency,
    phoneId: await phoneNumberRepository.getIdByPhoneNumber(
      agency.phoneNumber,
      timeGateway.now(),
    ),
    updatedAt: updatedAt ?? timeGateway.now().toISOString(),
  };
};

export const toAgencyUpdateParams = async (
  agency: AgencyWithUsersRights,
  phoneNumberRepository: PhoneNumberRepository,
  timeGateway: TimeGateway,
): Promise<{
  partialAgency: PartialAgencyWithUsersRights;
  newPhoneId: number;
}> => {
  return {
    partialAgency: agency,
    newPhoneId: await phoneNumberRepository.getIdByPhoneNumber(
      agency.phoneNumber,
      timeGateway.now(),
    ),
  };
};

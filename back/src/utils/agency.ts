import { filter, map, toPairs, uniq } from "ramda";
import {
  type AgencyDto,
  type AgencyId,
  type AgencyRight,
  type AgencyUsersRights,
  type AgencyWithUsersRights,
  type ConventionAgencyFields,
  type Email,
  type UserId,
  type UserWithAdminRights,
  errors,
  pipeWithValue,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import type { AgencyRepository } from "../domains/agency/ports/AgencyRepository";
import type { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";

export const toAgencyWithRights = (
  { counsellorEmails, validatorEmails, ...rest }: AgencyDto,
  usersRights?: AgencyUsersRights,
): AgencyWithUsersRights => ({
  ...rest,
  usersRights: {
    ...counsellorEmails.reduce<AgencyUsersRights>(
      (acc, _, index) => ({
        ...acc,
        [`counsellor${index}`]: {
          isNotifiedByEmail: true,
          roles: ["counsellor"],
        },
      }),
      {},
    ),
    ...validatorEmails.reduce<AgencyUsersRights>(
      (acc, _, index) => ({
        ...acc,
        [`validator${index}`]: {
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
      }),
      {},
    ),
    ...usersRights,
  },
});

export const agencyWithRightToAgencyDto = async (
  uow: UnitOfWork,
  { usersRights, ...rest }: AgencyWithUsersRights,
): Promise<AgencyDto> => {
  const { counsellorIds, validatorIds } = toPairs(usersRights).reduce<{
    counsellorIds: UserId[];
    validatorIds: UserId[];
  }>(
    (acc, item) => {
      const [userId, userRights] = item;

      return {
        counsellorIds: [
          ...acc.counsellorIds,
          ...(userRights?.roles.includes("counsellor") &&
          userRights?.isNotifiedByEmail
            ? [userId]
            : []),
        ],
        validatorIds: [
          ...acc.validatorIds,
          ...(userRights?.roles.includes("validator") &&
          userRights?.isNotifiedByEmail
            ? [userId]
            : []),
        ],
      };
    },
    { counsellorIds: [], validatorIds: [] },
  );

  const counsellors = await uow.userRepository.getByIds(counsellorIds);

  const validators = await uow.userRepository.getByIds(validatorIds);

  return {
    ...rest,
    counsellorEmails: counsellors.map(({ email }) => email),
    validatorEmails: validators.map(({ email }) => email),
  };
};

export const getAgencyRightByUserId = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<AgencyRight[]> => {
  const agenciesRightsForUser =
    await uow.agencyRepository.getAgenciesRightsByUserId(userId);

  const agenciesWithAdminEmailsById = await getAgencyAndAdminEmailsByAgencyId({
    uow,
    agencyIds: agenciesRightsForUser.map((agency) => agency.agencyId),
  });

  return Promise.all(
    agenciesRightsForUser.map<Promise<AgencyRight>>(
      async ({ isNotifiedByEmail, roles, agencyId }) => {
        const agencyWithAdminEmails = agenciesWithAdminEmailsById[agencyId];
        if (!agencyWithAdminEmails) throw errors.agency.notFound({ agencyId });
        const { agency, adminEmails } = agencyWithAdminEmails;
        return {
          isNotifiedByEmail,
          roles,
          agency: toAgencyDtoForAgencyUsersAndAdmins(agency, adminEmails),
        };
      },
    ),
  );
};

export const updateRightsOnMultipleAgenciesForUser = async (
  uow: UnitOfWork,
  userId: UserId,
  agenciesRightForUser: AgencyRight[],
): Promise<void> => {
  await Promise.all(
    agenciesRightForUser.map(
      async ({ agency: { id }, isNotifiedByEmail, roles }) => {
        const agency = await uow.agencyRepository.getById(id);
        if (!agency) throw errors.agency.notFound({ agencyId: id });
        return uow.agencyRepository.update({
          id: agency.id,
          usersRights: {
            ...agency.usersRights,
            [userId]: { isNotifiedByEmail, roles },
          },
        });
      },
    ),
  );
};

export const getAgencyAndAdminEmailsByAgencyId = async ({
  uow,
  agencyIds,
}: { uow: UnitOfWork; agencyIds: AgencyId[] }): Promise<
  Record<AgencyId, { agency: AgencyWithUsersRights; adminEmails: Email[] }>
> => {
  const agencies = await uow.agencyRepository.getByIds(agencyIds);

  const agencyAdminUserIds = agencies.flatMap((agency) =>
    pipeWithValue(
      agency.usersRights,
      toPairs,
      filter(([_, rights]) => rights?.roles.includes("agency-admin")),
      map(([id]) => id),
      uniq,
    ),
  );

  const usersWithAgencyAdminRole =
    await uow.userRepository.getByIds(agencyAdminUserIds);

  const usersWithAdminRoleById = usersWithAgencyAdminRole.reduce<
    Record<UserId, UserWithAdminRights>
  >((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  return agencies.reduce<
    Record<AgencyId, { agency: AgencyWithUsersRights; adminEmails: Email[] }>
  >((acc, agency) => {
    acc[agency.id] = {
      agency,
      adminEmails: toPairs(agency.usersRights)
        .filter(([_, rights]) => rights?.roles.includes("agency-admin"))
        .map(([userId]) => usersWithAdminRoleById[userId].email),
    };
    return acc;
  }, {});
};

export const throwErrorIfAgencyNotFound = async ({
  agencyId,
  agencyRepository,
}: { agencyId: string; agencyRepository: AgencyRepository }) => {
  const agency = await agencyRepository.getById(agencyId);

  if (!agency) {
    throw errors.agency.notFound({
      agencyId,
    });
  }
};

export const agencyDtoToConventionAgencyFields = (
  agency: AgencyDto,
): ConventionAgencyFields => ({
  agencyCounsellorEmails: agency.counsellorEmails,
  agencyValidatorEmails: agency.validatorEmails,
  agencyKind: agency.kind,
  agencyName: agency.name,
  agencySiret: agency.agencySiret,
  agencyDepartment: agency.coveredDepartments[0],
});

import { toPairs } from "ramda";
import { AgencyDto, AgencyRight, AgencyRole, UserId, errors } from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../domains/agency/ports/AgencyRepository";
import { makeProvider } from "../domains/core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";

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
  const provider = await makeProvider(uow);
  const counsellorUsers = await Promise.all(
    userIdWithRole(usersRights, "counsellor").map((id) =>
      uow.userRepository.getById(id, provider).then((user) => {
        if (!user) throw errors.user.notFound({ userId: id });
        return user;
      }),
    ),
  );
  const validatorUsers = await Promise.all(
    userIdWithRole(usersRights, "validator").map((id) =>
      uow.userRepository.getById(id, provider).then((user) => {
        if (!user) throw errors.user.notFound({ userId: id });
        return user;
      }),
    ),
  );
  return {
    ...rest,
    counsellorEmails: counsellorUsers.map(({ email }) => email),
    validatorEmails: validatorUsers.map(({ email }) => email),
  };
};

export const getAgencyRightByUserId = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<AgencyRight[]> => {
  const agenciesRightsForUser =
    await uow.agencyRepository.getAgenciesRightsByUserId(userId);

  return Promise.all(
    agenciesRightsForUser.map(async ({ isNotifiedByEmail, roles, agency }) => ({
      isNotifiedByEmail,
      roles,
      agency: await agencyWithRightToAgencyDto(uow, agency),
    })),
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

const userIdWithRole = (usersRights: AgencyUsersRights, role: AgencyRole) =>
  toPairs(usersRights)
    .filter(([_, rights]) => rights.roles.includes(role))
    .map(([id]) => id);

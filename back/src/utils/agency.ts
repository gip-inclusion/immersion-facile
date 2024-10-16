import { toPairs } from "ramda";
import { AgencyDto, AgencyRole, OAuthGatewayProvider } from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../domains/agency/ports/AgencyRepository";
import { getUsersByIds } from "../domains/core/authentication/inclusion-connect/port/UserRepository";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";

export const toAgencyWithRights = (
  { counsellorEmails, validatorEmails, ...rest }: AgencyDto,
  usersRights: AgencyUsersRights,
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
  provider: OAuthGatewayProvider,
  { usersRights, ...rest }: AgencyWithUsersRights,
): Promise<AgencyDto> => {
  const counsellorUsers = await getUsersByIds(
    uow.userRepository,
    provider,
    userIdWithRole(usersRights, "counsellor"),
  );
  const validatorUsers = await getUsersByIds(
    uow.userRepository,
    provider,
    userIdWithRole(usersRights, "validator"),
  );
  return {
    ...rest,
    counsellorEmails: counsellorUsers.map(({ email }) => email),
    validatorEmails: validatorUsers.map(({ email }) => email),
  };
};

const userIdWithRole = (usersRights: AgencyUsersRights, role: AgencyRole) =>
  toPairs(usersRights)
    .filter(([_, rights]) => rights.roles.includes(role))
    .map(([id]) => id);

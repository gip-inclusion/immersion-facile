import { toPairs } from "ramda";
import {
  AgencyDto,
  AgencyRole,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  UserId,
  errors,
  isTruthy,
} from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../../agency/ports/AgencyRepository";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UserOnRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const throwIfIcUserNotBackofficeAdmin = async (
  uow: UnitOfWork,
  jwtPayload: InclusionConnectDomainJwtPayload,
) => {
  const user = await getIcUserOrThrow(uow, jwtPayload.userId);
  if (!user.isBackofficeAdmin)
    throw errors.user.notBackOfficeAdmin({ userId: jwtPayload.userId });
};

export const getIcUserOrThrow = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<InclusionConnectedUser> => {
  const provider = oAuthProviderByFeatureFlags(
    await uow.featureFlagRepository.getAll(),
  );
  const user = await uow.userRepository.getById(userId, provider);
  if (!user) throw errors.user.notFound({ userId });

  const agencyRights =
    await uow.agencyRepository.getAgenciesRightsByUserId(userId);
  return {
    ...user,
    agencyRights: await Promise.all(
      agencyRights.map(async ({ agency, isNotifiedByEmail, roles }) => ({
        agency: await agencyWithUsersRightsToAgencyDto(uow, provider, agency),
        isNotifiedByEmail,
        roles,
      })),
    ),
    dashboards: { agencies: {}, establishments: {} },
  };
};

export const throwIfNotAdmin = (user: InclusionConnectedUser | undefined) => {
  if (!user) throw errors.user.unauthorized();
  if (!user.isBackofficeAdmin) throw errors.user.forbidden({ userId: user.id });
};

const agencyWithUsersRightsToAgencyDto = async (
  uow: UnitOfWork,
  provider: OAuthGatewayProvider,
  { usersRights, ...rest }: AgencyWithUsersRights,
): Promise<AgencyDto> => {
  const counsellorUsers = await usersWithRoleFromRights(
    uow,
    provider,
    usersRights,
    "counsellor",
  );
  const validatorUsers = await usersWithRoleFromRights(
    uow,
    provider,
    usersRights,
    "validator",
  );

  return {
    ...rest,
    counsellorEmails: counsellorUsers.map((user) => user.email),
    validatorEmails: validatorUsers.map((user) => user.email),
  };
};

const usersWithRoleFromRights = async (
  uow: UnitOfWork,
  provider: OAuthGatewayProvider,
  usersRights: AgencyUsersRights,
  role: AgencyRole,
): Promise<UserOnRepository[]> => {
  const userIdsWithRole = toPairs(usersRights).filter(([_, right]) =>
    right.roles.includes(role),
  );
  const users = await Promise.all(
    userIdsWithRole.map(([userId]) =>
      uow.userRepository.getById(userId, provider),
    ),
  );
  return users.filter(isTruthy);
};

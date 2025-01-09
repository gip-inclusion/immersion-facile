import { toPairs, uniq, values } from "ramda";
import {
  AgencyId,
  AgencyRight,
  AgencyWithUsersRights,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  UserId,
  errors,
} from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import { AgencyRightOfUser } from "../../agency/ports/AgencyRepository";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const getIcUserByUserId = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<InclusionConnectedUser> => {
  const user = await uow.userRepository.getById(
    userId,
    await makeProvider(uow),
  );
  if (!user) throw errors.user.notFound({ userId });
  return {
    ...user,
    agencyRights: await getAgencyRightByUserId(uow, user.id),
    dashboards: { agencies: {}, establishments: {} },
  };
};

export const getIcUsersByUserIds = async (
  uow: UnitOfWork,
  userIds: UserId[],
): Promise<InclusionConnectedUser[]> => {
  const provider = await makeProvider(uow);
  const users = await uow.userRepository.getByIds(userIds, provider);

  const userRightsByUser = (
    await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        rights: await uow.agencyRepository.getAgenciesRightsByUserId(userId),
      })),
    )
  ).reduce<Record<UserId, AgencyRightOfUser[]>>(
    (acc, current) => ({ ...acc, [current.userId]: current.rights }),
    {},
  );

  const agenciesRelatedToUsersByAgencyId = (
    await uow.agencyRepository.getByIds(
      uniq(
        values(userRightsByUser).flatMap((rights) =>
          rights.map((right) => right.agencyId),
        ),
      ),
    )
  ).reduce<Record<AgencyId, AgencyWithUsersRights>>(
    (acc, current) => ({ ...acc, [current.id]: current }),
    {},
  );

  return Promise.all(
    users.map<Promise<InclusionConnectedUser>>(async (user) => ({
      ...user,
      agencyRights: await makeAgencyRights(
        userRightsByUser[user.id],
        agenciesRelatedToUsersByAgencyId,
        uow,
        provider,
      ),
      dashboards: { agencies: {}, establishments: {} },
    })),
  );
};

const makeAgencyRights = (
  userRights: AgencyRightOfUser[],
  agenciesRelatedToUsersByAgencyId: Record<AgencyId, AgencyWithUsersRights>,
  uow: UnitOfWork,
  provider: OAuthGatewayProvider,
): Promise<AgencyRight[]> =>
  Promise.all(
    userRights.map<Promise<AgencyRight>>(async ({ agencyId, ...rights }) => {
      const { usersRights, ...agency } =
        agenciesRelatedToUsersByAgencyId[agencyId];

      const adminUsers = await uow.userRepository.getByIds(
        toPairs(usersRights)
          .filter(([_, userRight]) => userRight?.roles.includes("agency-admin"))
          .map(([id]) => id),
        provider,
      );

      return {
        ...rights,
        agency: {
          ...agency,
          admins: adminUsers.map((user) => user.email),
        },
      };
    }),
  );

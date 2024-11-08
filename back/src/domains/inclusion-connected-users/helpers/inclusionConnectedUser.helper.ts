import { uniq, values } from "ramda";
import {
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  UserId,
  errors,
} from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import {
  AgencyRightOfUser,
  AgencyWithUsersRights,
} from "../../agency/ports/AgencyRepository";
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
  const users = await uow.userRepository.getByIds(
    userIds,
    await makeProvider(uow),
  );

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

  return users.map<InclusionConnectedUser>((user) => ({
    ...user,
    agencyRights: userRightsByUser[user.id].map<AgencyRight>(
      ({ agencyId, ...rights }) => {
        const { usersRights: _, ...agency } =
          agenciesRelatedToUsersByAgencyId[agencyId];
        return {
          ...rights,
          agency,
        };
      },
    ),
    dashboards: { agencies: {}, establishments: {} },
  }));
};

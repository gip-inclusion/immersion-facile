import { keys, toPairs, uniq, values } from "ramda";
import {
  type AbsoluteUrl,
  type AgencyDashboards,
  type AgencyId,
  type AgencyRight,
  type AgencyWithUsersRights,
  agencyRoleIsNotToReview,
  type ConnectedUser,
  type EstablishmentDashboards,
  type User,
  type UserId,
  type UserWithAdminRights,
  type UserWithRights,
  type WithDashboards,
} from "shared";
import type { AgencyRightOfUser } from "../../agency/ports/AgencyRepository";
import { emptyName } from "../../core/authentication/connected-user/entities/user.helper";
import type { UserRepository } from "../../core/authentication/connected-user/port/UserRepository";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "./userRights.helper";

export const getConnectedUserByUserId = async ({
  uow,
  userId,
  dashboardGateway,
  timeGateway,
}: {
  uow: UnitOfWork;
  userId: UserId;
  dashboardGateway: DashboardGateway;
  timeGateway: TimeGateway;
}): Promise<ConnectedUser> => {
  const user = await getUserWithRights(uow, userId);

  return {
    ...user,
    ...(await withDashboards({ uow, dashboardGateway, timeGateway, user })),
  };
};

export const getConnectedUsersByUserIds = async (
  uow: UnitOfWork,
  userIds: UserId[],
  agencyId?: AgencyId,
): Promise<ConnectedUser[]> => {
  const users = await uow.userRepository.getByIds(userIds);

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
        values(userRightsByUser)
          .flatMap((rights) => rights.map((right) => right.agencyId))
          .filter((userAgencyId) =>
            agencyId ? agencyId === userAgencyId : true,
          ),
      ),
    )
  ).reduce<Record<AgencyId, AgencyWithUsersRights>>(
    (acc, current) => ({ ...acc, [current.id]: current }),
    {},
  );

  return Promise.all(
    users.map<Promise<ConnectedUser>>(async (user) => ({
      ...user,
      agencyRights: await makeAgencyRights(
        userRightsByUser[user.id],
        agenciesRelatedToUsersByAgencyId,
        uow,
      ),
      dashboards: { agencies: {}, establishments: {} }, /// ?????
      // establishments: ???????
    })),
  );
};

const makeAgencyRights = (
  userRights: AgencyRightOfUser[],
  agenciesRelatedToUsersByAgencyId: Record<AgencyId, AgencyWithUsersRights>,
  uow: UnitOfWork,
): Promise<AgencyRight[]> => {
  const agencyIds = keys(agenciesRelatedToUsersByAgencyId);
  return Promise.all(
    userRights
      .filter((userRight) => agencyIds.includes(userRight.agencyId))
      .map<Promise<AgencyRight>>(async ({ agencyId, ...rights }) => {
        const { usersRights, ...agency } =
          agenciesRelatedToUsersByAgencyId[agencyId];

        const adminUsers = await uow.userRepository.getByIds(
          toPairs(usersRights)
            .filter(([_, userRight]) =>
              userRight?.roles.includes("agency-admin"),
            )
            .map(([id]) => id),
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
};

async function makeAgencyDashboards({
  uow,
  dashboardGateway,
  timeGateway,
  user,
}: {
  uow: UnitOfWork;
  dashboardGateway: DashboardGateway;
  timeGateway: TimeGateway;
  user: UserWithRights;
}): Promise<AgencyDashboards> {
  const agencyIdsWithEnoughPrivileges = user.agencyRights
    .filter(({ roles }) => agencyRoleIsNotToReview(roles))
    .map(({ agency }) => agency.id);

  const agencyKinds = uniq(
    user.agencyRights
      .filter(({ roles }) => agencyRoleIsNotToReview(roles))
      .map(({ agency }) => agency.kind),
  );
  const agencyIds = uniq(
    user.agencyRights
      .filter(({ roles }) => agencyRoleIsNotToReview(roles))
      .map(({ agency }) => agency.id),
  );

  const isSynchronisationEnableForAgency =
    agencyKinds.includes("pole-emploi") ||
    (
      await uow.apiConsumerRepository.getByFilters({
        agencyIds,
        agencyKinds,
      })
    ).length > 0;

  const agencyKind = agencyKinds.length === 1 ? agencyKinds[0] : undefined;

  return {
    ...(agencyIdsWithEnoughPrivileges.length > 0
      ? dashboardGateway.getAgencyUserUrls(
          user.id,
          agencyKind,
          timeGateway.now(),
        )
      : {}),
    ...(agencyIdsWithEnoughPrivileges.length > 0
      ? {
          erroredConventionsDashboardUrl: isSynchronisationEnableForAgency
            ? dashboardGateway.getErroredConventionsDashboardUrl(
                user.id,
                timeGateway.now(),
              )
            : undefined,
        }
      : {}),
  };
}

const withDashboards = async ({
  uow,
  dashboardGateway,
  timeGateway,
  user,
}: {
  uow: UnitOfWork;
  dashboardGateway: DashboardGateway;
  timeGateway: TimeGateway;
  user: UserWithRights;
}): Promise<WithDashboards> => ({
  dashboards: {
    agencies: await makeAgencyDashboards({
      uow,
      dashboardGateway,
      timeGateway,
      user,
    }),
    establishments: await makeEstablishmentDashboard(
      uow,
      dashboardGateway,
      timeGateway,
      user,
    ),
  },
});

const makeEstablishmentDashboard = async (
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  user: User,
): Promise<EstablishmentDashboards> => {
  const establishmentAggregates =
    await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
      {
        userId: user.id,
      },
    );

  const userHasEstablishmentRights = establishmentAggregates.length > 0;
  const [conventions, discussions] = await Promise.all([
    makeConventionEstablishmentDashboard({
      uow: uow,
      dashboardGateway: dashboardGateway,
      timeGateway: timeGateway,
      user,
      userHasEstablishmentRights,
    }),
    makeDiscussionsEstablishmentDashboard({
      dashboardGateway: dashboardGateway,
      timeGateway: timeGateway,
      user: user,
      userHasEstablishmentRights,
    }),
  ]);

  return {
    ...(conventions ? { conventions } : {}),
    ...(discussions ? { discussions } : {}),
  };
};

const makeConventionEstablishmentDashboard = async ({
  uow,
  dashboardGateway,
  timeGateway,
  user,
  userHasEstablishmentRights,
}: {
  uow: UnitOfWork;
  dashboardGateway: DashboardGateway;
  timeGateway: TimeGateway;
  user: User;
  userHasEstablishmentRights: boolean;
}): Promise<AbsoluteUrl | undefined> => {
  const conventionDashboardUrl =
    dashboardGateway.getEstablishmentConventionsDashboardUrl(
      user.id,
      timeGateway.now(),
    );

  if (userHasEstablishmentRights) return conventionDashboardUrl;

  const hasConventionForEstablishmentRepresentative =
    (
      await uow.conventionQueries.getConventionIdsByFilters({
        filters: {
          withEstablishmentRepresentative: { email: user.email },
        },
      })
    ).length > 0;

  if (hasConventionForEstablishmentRepresentative)
    return conventionDashboardUrl;

  const hasConventionForEstablishmentTutor =
    (
      await uow.conventionQueries.getConventionIdsByFilters({
        filters: {
          withEstablishmentTutor: { email: user.email },
        },
      })
    ).length > 0;

  if (hasConventionForEstablishmentTutor) return conventionDashboardUrl;

  return undefined;
};

const makeDiscussionsEstablishmentDashboard = async ({
  dashboardGateway,
  timeGateway,
  user,
  userHasEstablishmentRights,
}: {
  dashboardGateway: DashboardGateway;
  timeGateway: TimeGateway;
  user: User;
  userHasEstablishmentRights: boolean;
}): Promise<AbsoluteUrl | undefined> =>
  userHasEstablishmentRights
    ? dashboardGateway.getEstablishmentDiscussionsDashboardUrl(
        user.id,
        timeGateway.now(),
      )
    : undefined;

export const getUserByEmailAndCreateIfMissing = async ({
  userRepository,
  timeGateway,
  userIdIfNew,
  userEmail,
}: {
  userRepository: UserRepository;
  timeGateway: TimeGateway;
  userIdIfNew: UserId;
  userEmail: string;
}): Promise<User> =>
  (await userRepository.findByEmail(userEmail)) ||
  (await saveAndProvideNewUser(userRepository, {
    id: userIdIfNew,
    email: userEmail,
    createdAt: timeGateway.now().toISOString(),
    firstName: emptyName,
    lastName: emptyName,
    proConnect: null,
  }));

const saveAndProvideNewUser = async (
  userRepository: UserRepository,
  newUser: UserWithAdminRights,
) => {
  await userRepository.save(newUser);
  return newUser;
};

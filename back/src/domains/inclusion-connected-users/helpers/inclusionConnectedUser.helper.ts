import { toPairs, uniq, values } from "ramda";
import {
  type AbsoluteUrl,
  type AgencyDashboards,
  type AgencyId,
  type AgencyRight,
  type AgencyWithUsersRights,
  type ConventionsEstablishmentDashboard,
  type EstablishmentDashboards,
  type InclusionConnectedUser,
  type User,
  type UserId,
  type UserWithRights,
  type WithDashboards,
  agencyRoleIsNotToReview,
} from "shared";
import type { AgencyRightOfUser } from "../../agency/ports/AgencyRepository";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "./userRights.helper";

export const getIcUserByUserId = async ({
  uow,
  userId,
  dashboardGateway,
  timeGateway,
}: {
  uow: UnitOfWork;
  userId: UserId;
  dashboardGateway: DashboardGateway;
  timeGateway: TimeGateway;
}): Promise<InclusionConnectedUser> => {
  const user = await getUserWithRights(uow, userId);

  return {
    ...user,
    ...(await withDashboards({ uow, dashboardGateway, timeGateway, user })),
  };
};

export const getIcUsersByUserIds = async (
  uow: UnitOfWork,
  userIds: UserId[],
): Promise<InclusionConnectedUser[]> => {
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
): Promise<AgencyRight[]> =>
  Promise.all(
    userRights.map<Promise<AgencyRight>>(async ({ agencyId, ...rights }) => {
      const { usersRights, ...agency } =
        agenciesRelatedToUsersByAgencyId[agencyId];

      const adminUsers = await uow.userRepository.getByIds(
        toPairs(usersRights)
          .filter(([_, userRight]) => userRight?.roles.includes("agency-admin"))
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
  const apiConsumers = await uow.apiConsumerRepository.getAll();

  const agencyIdsWithEnoughPrivileges = user.agencyRights
    .filter(({ roles }) => agencyRoleIsNotToReview(roles))
    .map(({ agency }) => agency.id);

  const isSynchronisationEnableForAgency = user.agencyRights.some(
    (agencyRight) =>
      agencyRight.agency.kind === "pole-emploi" ||
      apiConsumers.some(
        (apiconsumer) =>
          apiconsumer.rights.convention.scope.agencyIds?.includes(
            agencyRight.agency.id,
          ) ||
          apiconsumer.rights.convention.scope.agencyKinds?.includes(
            agencyRight.agency.kind,
          ),
      ),
  );

  return {
    ...(agencyIdsWithEnoughPrivileges.length > 0
      ? {
          agencyDashboardUrl: await dashboardGateway.getAgencyUserUrl(
            user.id,
            timeGateway.now(),
          ),
        }
      : {}),
    ...(agencyIdsWithEnoughPrivileges.length > 0
      ? {
          erroredConventionsDashboardUrl: isSynchronisationEnableForAgency
            ? await dashboardGateway.getErroredConventionsDashboardUrl(
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

async function makeEstablishmentDashboard(
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  user: User,
): Promise<EstablishmentDashboards> {
  const conventions = await makeConventionEstablishmentDashboard(
    uow,
    dashboardGateway,
    timeGateway,
    user,
  );
  const discussions = await makeDiscussionsEstablishmentDashboard(
    uow,
    dashboardGateway,
    timeGateway,
    user,
  );
  return {
    ...(conventions ? { conventions } : {}),
    ...(discussions ? { discussions } : {}),
  };
}

async function makeConventionEstablishmentDashboard(
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  user: User,
): Promise<ConventionsEstablishmentDashboard | undefined> {
  const hasConventionForEstablishmentRepresentative =
    (
      await uow.conventionRepository.getIdsByEstablishmentRepresentativeEmail(
        user.email,
      )
    ).length > 0;

  const hasConventionForEstablishmentTutor =
    (await uow.conventionRepository.getIdsByEstablishmentTutorEmail(user.email))
      .length > 0;

  return hasConventionForEstablishmentRepresentative ||
    hasConventionForEstablishmentTutor
    ? {
        url: await dashboardGateway.getEstablishmentConventionsDashboardUrl(
          user.id,
          timeGateway.now(),
        ),
        role: hasConventionForEstablishmentRepresentative
          ? "establishment-representative"
          : "establishment-tutor",
      }
    : undefined;
}

async function makeDiscussionsEstablishmentDashboard(
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  user: User,
): Promise<AbsoluteUrl | undefined> {
  const hasDiscussion = await uow.discussionRepository.hasDiscussionMatching({
    establishmentRepresentativeEmail: user.email,
  });
  return hasDiscussion
    ? dashboardGateway.getEstablishmentDiscussionsDashboardUrl(
        user.id,
        timeGateway.now(),
      )
    : undefined;
}

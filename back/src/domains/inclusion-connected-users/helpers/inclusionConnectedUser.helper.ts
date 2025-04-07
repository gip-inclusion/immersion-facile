import { toPairs, uniq, values } from "ramda";
import {
  type AbsoluteUrl,
  type AgencyId,
  type AgencyRight,
  type AgencyWithUsersRights,
  type ConventionsEstablishmentDashboard,
  type Email,
  type EstablishmentDashboards,
  type InclusionConnectedUser,
  type UserId,
  type WithDashboards,
  agencyRoleIsNotToReview,
  errors,
} from "shared";
import type { AgencyRightOfUser } from "../../agency/ports/AgencyRepository";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "./userRights.helper";

export const getIcUserByUserId = async (
  uow: UnitOfWork,
  userId: UserId,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
): Promise<InclusionConnectedUser> => {
  const { proConnect, ...rest } = await getUserWithRights(uow, userId);
  if (!proConnect) throw errors.user.missingProConnectInfos(userId);
  return {
    ...rest,
    proConnect,
    ...(await withDashboards(
      uow,
      dashboardGateway,
      timeGateway,
      rest.id,
      rest.email,
      rest.agencyRights,
    )),
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
    users.map<Promise<InclusionConnectedUser>>(
      async ({ proConnect, ...rest }) => {
        if (!proConnect) throw errors.user.missingProConnectInfos(rest.id);
        return {
          ...rest,
          proConnect,
          agencyRights: await makeAgencyRights(
            userRightsByUser[rest.id],
            agenciesRelatedToUsersByAgencyId,
            uow,
          ),
          dashboards: { agencies: {}, establishments: {} },
        };
      },
    ),
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

async function makeAgencyDashboards(
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  userId: UserId,
  agencyRights: AgencyRight[],
) {
  const apiConsumers = await uow.apiConsumerRepository.getAll();

  const agencyIdsWithEnoughPrivileges = agencyRights
    .filter(({ roles }) => agencyRoleIsNotToReview(roles))
    .map(({ agency }) => agency.id);

  const isSynchronisationEnableForAgency = agencyRights.some(
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
            userId,
            timeGateway.now(),
          ),
        }
      : {}),
    ...(agencyIdsWithEnoughPrivileges.length > 0
      ? {
          erroredConventionsDashboardUrl: isSynchronisationEnableForAgency
            ? await dashboardGateway.getErroredConventionsDashboardUrl(
                userId,
                timeGateway.now(),
              )
            : undefined,
        }
      : {}),
  };
}

async function withDashboards(
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  userId: UserId,
  email: Email,
  agencyRights: AgencyRight[],
): Promise<WithDashboards> {
  return {
    dashboards: {
      agencies: await makeAgencyDashboards(
        uow,
        dashboardGateway,
        timeGateway,
        userId,
        agencyRights,
      ),
      establishments: await makeEstablishmentDashboard(
        uow,
        dashboardGateway,
        timeGateway,
        userId,
        email,
      ),
    },
  };
}

async function makeEstablishmentDashboard(
  uow: UnitOfWork,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
  userId: UserId,
  email: Email,
): Promise<EstablishmentDashboards> {
  const conventions = await makeConventionEstablishmentDashboard(
    uow,
    dashboardGateway,
    timeGateway,
    userId,
    email,
  );
  const discussions = await makeDiscussionsEstablishmentDashboard(
    uow,
    dashboardGateway,
    timeGateway,
    userId,
    email,
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
  userId: UserId,
  email: Email,
): Promise<ConventionsEstablishmentDashboard | undefined> {
  const hasConventionForEstablishmentRepresentative =
    (
      await uow.conventionRepository.getIdsByEstablishmentRepresentativeEmail(
        email,
      )
    ).length > 0;

  const hasConventionForEstablishmentTutor =
    (await uow.conventionRepository.getIdsByEstablishmentTutorEmail(email))
      .length > 0;

  return hasConventionForEstablishmentRepresentative ||
    hasConventionForEstablishmentTutor
    ? {
        url: await dashboardGateway.getEstablishmentConventionsDashboardUrl(
          userId,
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
  userId: UserId,
  email: Email,
): Promise<AbsoluteUrl | undefined> {
  const hasDiscussion = await uow.discussionRepository.hasDiscussionMatching({
    establishmentRepresentativeEmail: email,
  });
  return hasDiscussion
    ? dashboardGateway.getEstablishmentDiscussionsDashboardUrl(
        userId,
        timeGateway.now(),
      )
    : undefined;
}

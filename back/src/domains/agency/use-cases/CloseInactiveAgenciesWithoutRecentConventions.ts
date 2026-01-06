import { subMonths } from "date-fns";
import { toPairs, uniq } from "ramda";
import {
  type AgencyWithUsersRights,
  executeInSequence,
  isTruthy,
  type UserId,
  type UserWithAdminRights,
} from "shared";
import { z } from "zod";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type CloseInactiveAgenciesWithoutRecentConventionsInput = {
  numberOfMonthsWithoutConvention: number;
};

export type CloseInactiveAgenciesWithoutRecentConventionsResult = {
  numberOfAgenciesClosed: number;
};

export type CloseInactiveAgenciesWithoutRecentConventions = ReturnType<
  typeof makeCloseInactiveAgenciesWithoutRecentConventions
>;

const closeInactiveAgenciesWithoutRecentConventionsInputSchema = z.object({
  numberOfMonthsWithoutConvention: z.number(),
});

export const makeCloseInactiveAgenciesWithoutRecentConventions = useCaseBuilder(
  "CloseInactiveAgenciesWithoutRecentConventions",
)
  .withInput(closeInactiveAgenciesWithoutRecentConventionsInputSchema)
  .withOutput<CloseInactiveAgenciesWithoutRecentConventionsResult>()
  .withDeps<{
    timeGateway: TimeGateway;
    saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
  }>()
  .build(async ({ uow, deps, inputParams }) => {
    const { numberOfMonthsWithoutConvention } = inputParams;
    const now = deps.timeGateway.now();
    const activeAgencies = await uow.agencyRepository.getAgencies({
      filters: {
        status: ["active", "from-api-PE"],
      },
    });

    const noConventionSince = subMonths(now, numberOfMonthsWithoutConvention);

    const agenciesToClose = await getAgenciesToClose(
      activeAgencies,
      uow,
      noConventionSince,
    );

    if (agenciesToClose.length === 0) {
      return {
        numberOfAgenciesClosed: 0,
      };
    }

    const notifications = await getNotificationsForClosedAgencies(
      agenciesToClose,
      uow,
      numberOfMonthsWithoutConvention,
    );

    await Promise.all(
      agenciesToClose.map((agency) =>
        uow.agencyRepository.update({
          id: agency.id,
          status: "closed",
          statusJustification: "Agence fermée automatiquement pour inactivité",
        }),
      ),
    );
    await deps.saveNotificationsBatchAndRelatedEvent(uow, notifications);

    return {
      numberOfAgenciesClosed: agenciesToClose.map((agency) => agency.id).length,
    };
  });

const getNotificationsForClosedAgencies = async (
  agencies: AgencyWithUsersRights[],
  uow: UnitOfWork,
  numberOfMonthsWithoutConvention: number,
): Promise<NotificationContentAndFollowedIds[]> => {
  const agenciesWithAdmins = agencies
    .map((agency) => {
      const agencyAdminUserIds: UserId[] = toPairs(agency.usersRights)
        .filter(([_, rights]) => rights?.roles.includes("agency-admin"))
        .map(([userId]) => userId)
        .filter(isTruthy);

      return agencyAdminUserIds.length > 0
        ? { agency, adminUserIds: agencyAdminUserIds }
        : null;
    })
    .filter(isTruthy);

  if (agenciesWithAdmins.length === 0) {
    return [];
  }

  const allAdminUserIds = uniq(
    agenciesWithAdmins.flatMap(({ adminUserIds }) => adminUserIds),
  );

  if (allAdminUserIds.length === 0) {
    return [];
  }

  const allAdminUsers = await uow.userRepository.getByIds(allAdminUserIds);
  const usersById = allAdminUsers.reduce<Record<UserId, UserWithAdminRights>>(
    (acc, user) => {
      acc[user.id] = user;
      return acc;
    },
    {},
  );

  return agenciesWithAdmins
    .map(
      ({ agency, adminUserIds }): NotificationContentAndFollowedIds | null => {
        const recipients = adminUserIds
          .map((userId) => usersById[userId]?.email)
          .filter(isTruthy);

        return recipients.length > 0
          ? {
              kind: "email",
              templatedContent: {
                kind: "AGENCY_CLOSED_FOR_INACTIVITY",
                recipients: recipients,
                params: {
                  agencyName: agency.name,
                  numberOfMonthsWithoutConvention:
                    numberOfMonthsWithoutConvention,
                },
              },
              followedIds: {
                agencyId: agency.id,
              },
            }
          : null;
      },
    )
    .filter(isTruthy);
};

const getAgenciesToClose = async (
  agencies: AgencyWithUsersRights[],
  uow: UnitOfWork,
  noConventionSince: Date,
): Promise<AgencyWithUsersRights[]> => {
  const agenciesToCloseResults = await executeInSequence(
    agencies,
    async (agency): Promise<AgencyWithUsersRights | null> => {
      const agencyConventions =
        await uow.conventionQueries.getConventionsByScope({
          scope: { agencyIds: [agency.id] },
          limit: 10,
          filters: {
            withStatuses: [
              "ACCEPTED_BY_VALIDATOR",
              "IN_REVIEW",
              "PARTIALLY_SIGNED",
              "ACCEPTED_BY_COUNSELLOR",
              "READY_TO_SIGN",
            ],
            dateSubmissionSince: noConventionSince,
          },
        });

      if (agencyConventions.length === 0) {
        const referringAgencies =
          await uow.agencyRepository.getAgenciesRelatedToAgency(agency.id);

        if (referringAgencies.length === 0) return agency;

        const referringAgenciesConventions =
          await uow.conventionQueries.getConventionsByScope({
            scope: {
              agencyIds: referringAgencies.map((a) => a.id),
            },
            limit: 10,
            filters: {
              withStatuses: [
                "ACCEPTED_BY_VALIDATOR",
                "IN_REVIEW",
                "PARTIALLY_SIGNED",
                "ACCEPTED_BY_COUNSELLOR",
                "READY_TO_SIGN",
              ],
              dateSubmissionSince: noConventionSince,
            },
          });

        if (referringAgenciesConventions.length === 0) return agency;
      }

      return null;
    },
  );

  return agenciesToCloseResults.filter(isTruthy);
};

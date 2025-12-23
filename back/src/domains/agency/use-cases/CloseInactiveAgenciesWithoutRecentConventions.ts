import { toPairs } from "ramda";
import { type AgencyWithUsersRights, isTruthy, type UserId } from "shared";
import { z } from "zod";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type CloseInactiveAgenciesWithoutRecentConventionsInput = {
  noConventionSince: Date;
};

export type CloseInactiveAgenciesWithoutRecentConventionsResult = {
  numberOfAgenciesClosed: number;
};

export type CloseInactiveAgenciesWithoutRecentConventions = ReturnType<
  typeof makeCloseInactiveAgenciesWithoutRecentConventions
>;

const closeInactiveAgenciesWithoutRecentConventionsInputSchema = z.object({
  noConventionSince: z.date(),
});

export const makeCloseInactiveAgenciesWithoutRecentConventions = useCaseBuilder(
  "CloseInactiveAgenciesWithoutRecentConventions",
)
  .withInput(closeInactiveAgenciesWithoutRecentConventionsInputSchema)
  .withOutput<CloseInactiveAgenciesWithoutRecentConventionsResult>()
  .withDeps<{
    saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
  }>()
  .build(async ({ uow, deps, inputParams }) => {
    const { noConventionSince } = inputParams;

    const activeAgencies = await uow.agencyRepository.getAgencies({
      filters: {
        status: ["active", "from-api-PE"],
      },
    });

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
): Promise<NotificationContentAndFollowedIds[]> => {
  const notificationsPromises = agencies.map(async (agency) => {
    const agencyAdminUserIds: UserId[] = toPairs(agency.usersRights)
      .filter(([_, rights]) => rights?.roles.includes("agency-admin"))
      .map(([userId]) => userId)
      .filter(isTruthy);

    if (agencyAdminUserIds.length === 0) {
      return null;
    }

    const agencyAdminUsers =
      await uow.userRepository.getByIds(agencyAdminUserIds);
    const recipients = agencyAdminUsers.map((user) => user.email);

    const notification: NotificationContentAndFollowedIds = {
      kind: "email",
      templatedContent: {
        kind: "AGENCY_CLOSED_FOR_INACTIVITY",
        recipients: recipients,
        params: {
          agencyName: agency.name,
        },
      },
      followedIds: {
        agencyId: agency.id,
      },
    };

    return notification;
  });

  const notificationsResults = await Promise.all(notificationsPromises);
  return notificationsResults.filter(isTruthy);
};

const getAgenciesToClose = async (
  agencies: AgencyWithUsersRights[],
  uow: UnitOfWork,
  noConventionSince: Date,
): Promise<AgencyWithUsersRights[]> => {
  const agenciesToClosePromises = agencies.map(async (agency) => {
    const agencyConventions = await uow.conventionQueries.getConventionsByScope(
      {
        scope: { agencyIds: [agency.id] },
        limit: 1000,
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
      },
    );

    if (agencyConventions.length > 0) {
      return null;
    }

    const referringAgencies =
      await uow.agencyRepository.getAgenciesRelatedToAgency(agency.id);

    if (referringAgencies.length > 0) {
      const referringAgencyIds = referringAgencies.map((a) => a.id);
      const referringAgenciesConventions =
        await uow.conventionQueries.getConventionsByScope({
          scope: { agencyIds: referringAgencyIds },
          limit: 1000,
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

      if (referringAgenciesConventions.length > 0) {
        return null;
      }
    }

    return agency;
  });

  const agenciesToCloseResults = await Promise.all(agenciesToClosePromises);
  return agenciesToCloseResults.filter(isTruthy);
};

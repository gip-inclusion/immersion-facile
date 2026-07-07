import { toPairs, uniq } from "ramda";
import { type AbsoluteUrl, isTruthy } from "shared";
import { z } from "zod";
import type { AgencyWithNumberOfUsersToReview } from "../../agency/ports/AgencyRepository";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";

type Deps = {
  saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
  immersionBaseUrl: AbsoluteUrl;
};

export type RemindAgencyAdminThatNewUserRequestAgencyRight = ReturnType<
  typeof makeRemindAgencyAdminThatNewUserRequestAgencyRight
>;

export const makeRemindAgencyAdminThatNewUserRequestAgencyRight =
  useCaseBuilder("RemindAgencyAdminThatNewUserRequestAgencyRight")
    .withInput(z.void())
    .withOutput<{
      remindersSent: number;
    }>()
    .withDeps<Deps>()
    .build(
      async ({
        uow,
        deps: { immersionBaseUrl, saveNotificationsBatchAndRelatedEvent },
      }) =>
        uow.agencyRepository
          .getAllAgenciesWithUsersToReview()
          .then((agenciesWithNumberOfUsersToReview) =>
            makeNotifications({
              uow,
              immersionBaseUrl,
              agenciesWithNumberOfUsersToReview,
            }),
          )
          .then((notifications) =>
            saveNotificationsBatchAndRelatedEvent(uow, notifications).then(
              () => ({
                remindersSent: notifications.length,
              }),
            ),
          ),
    );

const makeNotifications = async ({
  uow,
  immersionBaseUrl,
  agenciesWithNumberOfUsersToReview,
}: {
  uow: UnitOfWork;
  immersionBaseUrl: AbsoluteUrl;
  agenciesWithNumberOfUsersToReview: AgencyWithNumberOfUsersToReview[];
}): Promise<NotificationContentAndFollowedIds[]> =>
  uow.userRepository
    .getByIds(
      uniq(
        agenciesWithNumberOfUsersToReview.flatMap(({ agency }) =>
          toPairs(agency.usersRights)
            .filter(([_, userRight]) =>
              userRight?.roles.includes("agency-admin"),
            )
            .map(([userId]) => userId)
            .filter(isTruthy),
        ),
      ),
    )
    .then((uniqAdminUsers) =>
      uniqAdminUsers.map(({ firstName, email, lastName, id: userId }) => ({
        kind: "email",
        templatedContent: {
          kind: "AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION",
          recipients: [email],
          params: {
            firstName,
            lastName,
            immersionBaseUrl,
            agencies: agenciesWithNumberOfUsersToReview
              .filter(({ agency: { usersRights } }) =>
                usersRights[userId]?.roles.includes("agency-admin"),
              )
              .map(({ agency: { name }, numberOfUsersToReview }) => ({
                agencyName: name,
                numberOfUsersToReview,
              })),
          },
        },
        followedIds: {
          userId,
        },
      })),
    );

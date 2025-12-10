import { toPairs, uniq } from "ramda";
import { type AbsoluteUrl, isTruthy, type UserId } from "shared";
import { z } from "zod";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type AgencyNameWithUsersToReview = {
  agencyName: string;
  numberOfUsersToReview: number;
};

type AgencyAdminWithAgencies = {
  userId: UserId;
  firstName: string;
  lastName: string;
  email: string;
  agencies: AgencyNameWithUsersToReview[];
};

export type RemindAgencyAdminThatNewUserRequestAgencyRightResult = {
  remindersSent: number;
  failures: {
    userId: UserId;
    error: Error;
  }[];
};

export type RemindAgencyAdminThatNewUserRequestAgencyRight = ReturnType<
  typeof makeRemindAgencyAdminThatNewUserRequestAgencyRight
>;

export const makeRemindAgencyAdminThatNewUserRequestAgencyRight =
  useCaseBuilder("RemindAgencyAdminThatNewUserRequestAgencyRight")
    .withInput(z.void())
    .withOutput<RemindAgencyAdminThatNewUserRequestAgencyRightResult>()
    .withDeps<{
      saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
      immersionBaseUrl: AbsoluteUrl;
    }>()
    .build(async ({ uow, deps }) => {
      const agenciesWithNumberOfUsersToReview =
        await uow.agencyRepository.getAllAgenciesWithUsersToReview();

      const agencyAdminUserIds: UserId[] = uniq(
        agenciesWithNumberOfUsersToReview.flatMap(({ agency }) =>
          toPairs(agency.usersRights)
            .filter(([_, userRight]) =>
              userRight?.roles.includes("agency-admin"),
            )
            .map(([userId]) => userId)
            .filter(isTruthy),
        ),
      );

      const adminUsers = await uow.userRepository.getByIds(agencyAdminUserIds);

      const agenciesRelatedToAdmin: AgencyAdminWithAgencies[] = adminUsers.map(
        (admin) => {
          const agencies: AgencyNameWithUsersToReview[] =
            agenciesWithNumberOfUsersToReview
              .filter(({ agency }) =>
                toPairs(agency.usersRights).some(
                  ([userId, userRight]) =>
                    userId === admin.id &&
                    userRight?.roles.includes("agency-admin"),
                ),
              )
              .map(({ agency, numberOfUsersToReview }) => ({
                agencyName: agency.name,
                numberOfUsersToReview,
              }));

          return {
            userId: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            agencies,
          };
        },
      );

      const notifications: NotificationContentAndFollowedIds[] =
        agenciesRelatedToAdmin.map((admin) => ({
          kind: "email",
          templatedContent: {
            kind: "AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION",
            recipients: [admin.email],
            params: {
              firstName: admin.firstName,
              lastName: admin.lastName,
              immersionBaseUrl: deps.immersionBaseUrl,
              agencies: admin.agencies.map((agency) => ({
                agencyName: agency.agencyName,
                numberOfUsersToReview: agency.numberOfUsersToReview,
              })),
            },
          },
          followedIds: {
            userId: admin.userId,
          },
        }));

      const failures: { userId: UserId; error: Error }[] = [];
      let remindersSent = 0;

      try {
        await deps.saveNotificationsBatchAndRelatedEvent(uow, notifications);
        remindersSent = notifications.length;
      } catch (error) {
        notifications.forEach((notification) => {
          const userId = notification.followedIds.userId;
          if (userId) {
            failures.push({
              userId,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          }
        });
      }

      return { remindersSent, failures };
    });

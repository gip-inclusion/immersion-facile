import { addDays, subDays, subYears } from "date-fns";
import { type AbsoluteUrl, frontRoutes } from "shared";
import { z } from "zod";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../../notifications/helpers/Notification";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../useCaseBuilder";
import {
  accountInactivityDelayInYears,
  deletionWarningDedupInDays,
  deletionWarningDelayInDays,
  inactiveUserNotificationEventPriority,
} from "./inactiveUserConstants";

export type WarnInactiveUsersResult = {
  numberOfWarningsSent: number;
};

export type WarnInactiveUsers = ReturnType<typeof makeWarnInactiveUsers>;

export const makeWarnInactiveUsers = useCaseBuilder("WarnInactiveUsers")
  .withInput(z.void())
  .withOutput<WarnInactiveUsersResult>()
  .withDeps<{
    saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;
    timeGateway: TimeGateway;
    immersionBaseUrl: AbsoluteUrl;
  }>()
  .build(async ({ uow, deps }) => {
    const featureFlags = await uow.featureFlagQueries.getAll();
    if (!featureFlags.enableInactiveUsersCleanup.isActive)
      return { numberOfWarningsSent: 0 };

    const now = deps.timeGateway.now();
    const twoYearsAgo = subYears(now, accountInactivityDelayInYears);
    const deletionDate = addDays(now, deletionWarningDelayInDays);
    const warningCutoff = subDays(now, deletionWarningDedupInDays);

    const loggedInLongAgoUserIds =
      await uow.userRepository.getUserIdsLoggedInLongAgo({
        since: twoYearsAgo,
      });

    const alreadyWarnedUserIds =
      await uow.notificationRepository.filterUserDeletionWarningNotifications({
        userIds: loggedInLongAgoUserIds,
        excludeWarnedSince: warningCutoff,
      });

    const alreadyWarned = new Set(alreadyWarnedUserIds);
    const notYetWarnedUserIds = loggedInLongAgoUserIds.filter(
      (id) => !alreadyWarned.has(id),
    );

    const candidateUserIdsWithoutActiveConvention =
      await uow.conventionQueries.getUserIdsWithNoActiveConvention({
        userIds: notYetWarnedUserIds,
        since: twoYearsAgo,
      });

    const inactiveUserIds =
      await uow.discussionRepository.getUserIdsWithNoRecentExchange({
        userIds: candidateUserIdsWithoutActiveConvention,
        since: twoYearsAgo,
      });

    const inactiveUsers = await uow.userRepository.getByIds(inactiveUserIds);

    const deletionDateFormatted = deletionDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const loginUrl: AbsoluteUrl = `${deps.immersionBaseUrl}/${frontRoutes.profile}`;

    const notifications: NotificationContentAndFollowedIds[] =
      inactiveUsers.map((user) => ({
        kind: "email",
        templatedContent: {
          kind: "ACCOUNT_DELETION_WARNING",
          recipients: [user.email],
          params: {
            fullName: `${user.firstName} ${user.lastName}`,
            deletionDate: deletionDateFormatted,
            loginUrl,
          },
        },
        followedIds: {
          userId: user.id,
        },
      }));

    await deps.saveNotificationsBatchAndRelatedEvent(uow, notifications, {
      priority: inactiveUserNotificationEventPriority,
    });

    return { numberOfWarningsSent: notifications.length };
  });

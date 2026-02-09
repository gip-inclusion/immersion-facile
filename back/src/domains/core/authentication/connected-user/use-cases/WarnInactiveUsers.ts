import { addDays, subDays, subYears } from "date-fns";
import { type AbsoluteUrl, frontRoutes } from "shared";
import { z } from "zod";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../../notifications/helpers/Notification";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../useCaseBuilder";

const accountInactivityDelayInYears = 2;
const deletionWarningDelayInDays = 7;
const deletionWarningDedupInDays = 9;

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
    const now = deps.timeGateway.now();
    const twoYearsAgo = subYears(now, accountInactivityDelayInYears);
    const deletionDate = addDays(now, deletionWarningDelayInDays);
    const warningCutoff = subDays(now, deletionWarningDedupInDays);

    const inactiveUsers = await uow.userRepository.getInactiveUsers(
      twoYearsAgo,
      { excludeWarnedSince: warningCutoff },
    );

    const deletionDateFormatted = deletionDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const loginUrl =
      `${deps.immersionBaseUrl}/${frontRoutes.profile}` as AbsoluteUrl;

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

    await deps.saveNotificationsBatchAndRelatedEvent(uow, notifications);

    return { numberOfWarningsSent: notifications.length };
  });

import { subDays, subYears } from "date-fns";
import type { DateRange } from "shared";
import { z } from "zod";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../useCaseBuilder";
import {
  accountInactivityDelayInYears,
  deletionWarningDedupInDays,
  deletionWarningDelayInDays,
  inactiveUserNotificationEventPriority,
} from "./inactiveUserConstants";

export type TriggerEventsToDeleteInactiveUsersResult = {
  numberOfDeletionsTriggered: number;
};

export type TriggerEventsToDeleteInactiveUsers = ReturnType<
  typeof makeTriggerEventsToDeleteInactiveUsers
>;

export const makeTriggerEventsToDeleteInactiveUsers = useCaseBuilder(
  "TriggerEventsToDeleteInactiveUsers",
)
  .withInput(z.void())
  .withOutput<TriggerEventsToDeleteInactiveUsersResult>()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ uow, deps }) => {
    const featureFlags = await uow.featureFlagQueries.getAll();
    if (!featureFlags.enableInactiveUsersCleanup.isActive)
      return { numberOfDeletionsTriggered: 0 };

    const now = deps.timeGateway.now();
    const twoYearsAgo = subYears(now, accountInactivityDelayInYears);

    const warnedRange: DateRange = {
      from: subDays(now, deletionWarningDedupInDays),
      to: subDays(now, deletionWarningDelayInDays),
    };

    const loggedInLongAgoUserIds =
      await uow.userRepository.getUserIdsLoggedInLongAgo({
        since: twoYearsAgo,
      });

    const candidateUserIds =
      await uow.notificationRepository.filterUserDeletionWarningNotifications({
        userIds: loggedInLongAgoUserIds,
        onlyWarnedBetween: warnedRange,
      });

    const candidateUserIdsWithoutActiveConvention =
      await uow.conventionQueries.getUserIdsWithNoActiveConvention({
        userIds: candidateUserIds,
        since: twoYearsAgo,
      });

    const userIdsToDelete =
      await uow.discussionRepository.getUserIdsWithNoRecentExchange({
        userIds: candidateUserIdsWithoutActiveConvention,
        since: twoYearsAgo,
      });

    const shouldQuarantine =
      !featureFlags.enableInactiveUsersDeletionAutoProcessing.isActive;

    const events = userIdsToDelete.map((userId) =>
      deps.createNewEvent({
        topic: "InactiveUserAccountDeletionTriggered",
        payload: { userId, triggeredBy: { kind: "crawler" } },
        wasQuarantined: shouldQuarantine,
        priority: inactiveUserNotificationEventPriority,
      }),
    );

    await uow.outboxRepository.saveNewEventsBatch(events);

    return { numberOfDeletionsTriggered: userIdsToDelete.length };
  });

import { subDays, subYears } from "date-fns";
import { z } from "zod";
import type { CreateNewEvent } from "../../../events/ports/EventBus";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../useCaseBuilder";
import {
  accountInactivityDelayInYears,
  deletionWarningDedupInDays,
  deletionWarningDelayInDays,
} from "./inactiveUserConstants";

// Low priority: business events (convention signing, assessment, etc.) should
// be processed first by the outbox workers.
const inactiveUserDeletionEventPriority = 8;

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
    const warnedFrom = subDays(now, deletionWarningDedupInDays);
    const warnedTo = subDays(now, deletionWarningDelayInDays);

    const loggedInLongAgoUserIds =
      await uow.userRepository.getUserIdsLoggedInLongAgo({
        since: twoYearsAgo,
      });

    const candidateUserIds =
      await uow.notificationRepository.filterUserDeletionWarningNotifications({
        userIds: loggedInLongAgoUserIds,
        onlyWarnedBetween: { from: warnedFrom, to: warnedTo },
      });

    const candidateUsers = await uow.userRepository.getByIds(candidateUserIds);

    const afterConventionFilterIds =
      await uow.conventionQueries.getUserIdsWithNoActiveConvention({
        users: candidateUsers,
        since: twoYearsAgo,
      });

    const afterConventionFilterIdSet = new Set(afterConventionFilterIds);
    const userIdsToDelete =
      await uow.discussionRepository.getUserIdsWithNoRecentExchange({
        users: candidateUsers.filter((u) =>
          afterConventionFilterIdSet.has(u.id),
        ),
        since: twoYearsAgo,
      });

    const shouldQuarantine =
      !featureFlags.enableInactiveUsersDeletionAutoProcessing.isActive;

    const events = userIdsToDelete.map((userId) =>
      deps.createNewEvent({
        topic: "InactiveUserAccountDeletionTriggered",
        payload: { userId, triggeredBy: { kind: "crawler" } },
        wasQuarantined: shouldQuarantine,
        priority: inactiveUserDeletionEventPriority,
      }),
    );

    await uow.outboxRepository.saveNewEventsBatch(events);

    return { numberOfDeletionsTriggered: userIdsToDelete.length };
  });

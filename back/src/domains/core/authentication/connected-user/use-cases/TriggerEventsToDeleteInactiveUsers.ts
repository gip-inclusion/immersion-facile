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
    const now = deps.timeGateway.now();
    const twoYearsAgo = subYears(now, accountInactivityDelayInYears);
    const warnedFrom = subDays(now, deletionWarningDedupInDays);
    const warnedTo = subDays(now, deletionWarningDelayInDays);

    const candidateUserIds = await uow.userRepository.getUserIdsLoggedInLongAgo(
      {
        since: twoYearsAgo,
        onlyWarnedBetween: { from: warnedFrom, to: warnedTo },
      },
    );

    const afterConventionFilterIds =
      await uow.conventionQueries.getUserIdsWithNoActiveConvention({
        userIds: candidateUserIds,
        since: twoYearsAgo,
      });

    const userIdsToDelete =
      await uow.discussionRepository.getUserIdsWithNoRecentExchange({
        userIds: afterConventionFilterIds,
        since: twoYearsAgo,
      });

    const events = userIdsToDelete.map((userId) =>
      deps.createNewEvent({
        topic: "InactiveUserAccountDeletionTriggered",
        payload: { userId },
      }),
    );

    await uow.outboxRepository.saveNewEventsBatch(events);

    return { numberOfDeletionsTriggered: userIdsToDelete.length };
  });

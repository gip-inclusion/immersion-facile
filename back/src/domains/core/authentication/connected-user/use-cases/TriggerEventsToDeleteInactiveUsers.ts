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

    const usersToDelete = await uow.userRepository.getInactiveUsers(
      twoYearsAgo,
      { onlyWarnedBetween: { from: warnedFrom, to: warnedTo } },
    );

    const events = usersToDelete.map((user) =>
      deps.createNewEvent({
        topic: "InactiveUserAccountDeletionTriggered",
        payload: { userId: user.id },
      }),
    );

    await uow.outboxRepository.saveNewEventsBatch(events);

    return { numberOfDeletionsTriggered: usersToDelete.length };
  });

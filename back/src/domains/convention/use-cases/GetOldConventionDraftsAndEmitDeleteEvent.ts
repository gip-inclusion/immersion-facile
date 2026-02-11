import { subDays } from "date-fns";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetOldConventionDraftsAndEmitDeleteEvent = ReturnType<
  typeof makeGetOldConventionDraftsAndEmitDeleteEvent
>;
export const makeGetOldConventionDraftsAndEmitDeleteEvent = useCaseBuilder(
  "GetOldConventionDraftsAndEmitDeleteEvent",
)
  .withOutput<{ numberOfOldConventionDraftIds: number }>()
  .withDeps<{ timeGateway: TimeGateway; createNewEvent: CreateNewEvent }>()
  .build(async ({ uow, deps }) => {
    const now = deps.timeGateway.now();
    const thirtyDaysAgo = subDays(now, 30);

    const oldConventionDraftIds =
      await uow.conventionDraftRepository.getConventionDraftIdsByFilters({
        lastUpdatedAt: thirtyDaysAgo,
      });

    const events = oldConventionDraftIds.map((oldConventionDraftId) =>
      deps.createNewEvent({
        topic: "ConventionDrafToDelete",
        payload: {
          conventionDraftId: oldConventionDraftId,
          triggeredBy: {
            kind: "crawler",
          },
        },
      }),
    );

    await uow.outboxRepository.saveNewEventsBatch(events);

    return { numberOfOldConventionDraftIds: oldConventionDraftIds.length };
  });

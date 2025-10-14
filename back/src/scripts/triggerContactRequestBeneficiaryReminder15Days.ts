import { subDays } from "date-fns";
import type { CreateNewEvent } from "../domains/core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import type { TimeGateway } from "../domains/core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../domains/core/useCaseBuilder";

// biome-ignore lint/correctness/noUnusedVariables: Not used feature/script ?
const makeTriggerContactRequestBeneficiaryReminder15Days = useCaseBuilder(
  "TriggerContactRequestBeneficiaryReminder15Days",
)
  .withOutput<{ numberOfReminders: number }>()
  .withDeps<{
    timeGateway: TimeGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ uow, deps }) => {
    const now = deps.timeGateway.now();
    const dayBefore15Days = subDays(now, 15);
    const dayAfter15Days = subDays(now, 14);

    const discussionsToFollowUp = await uow.discussionRepository.getDiscussions(
      {
        filters: {
          answeredByEstablishment: false,
          contactMode: "EMAIL",
          createdBetween: {
            from: dayBefore15Days,
            to: dayAfter15Days,
          },
        },
        limit: 5000,
      },
    );

    const events = discussionsToFollowUp.map(({ id: discussionId }) =>
      deps.createNewEvent({
        topic: "DiscussionBeneficiaryFollowUpRequested",
        payload: {
          discussionId,
          triggeredBy: {
            kind: "crawler",
          },
        },
      }),
    );

    await uow.outboxRepository.saveNewEventsBatch(events);

    return {
      numberOfReminders: events.length,
    };
  });

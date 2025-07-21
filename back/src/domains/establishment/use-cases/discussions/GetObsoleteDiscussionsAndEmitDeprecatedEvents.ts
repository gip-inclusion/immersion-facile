import { subMonths } from "date-fns";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type GetObsoleteDiscussionsAndEmitDeprecatedEvents = ReturnType<
  typeof makeGetObsoleteDiscussionsAndEmitDeprecatedEvent
>;

export const makeGetObsoleteDiscussionsAndEmitDeprecatedEvent = useCaseBuilder(
  "GetObsoleteDiscussionsAndEmitDeprecatedEvents",
)
  .withOutput<{ numberOfObsoleteDiscussions: number }>()
  .withDeps<{
    timeGateway: TimeGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ uow, deps }) => {
    const now = deps.timeGateway.now();
    const threeMonthsAgo = subMonths(now, 3);

    const obsoleteDiscussions =
      await uow.discussionRepository.getObsoleteDiscussions({
        olderThan: threeMonthsAgo,
      });

    const events = obsoleteDiscussions.map((discussionId) =>
      deps.createNewEvent({
        topic: "DiscussionMarkedAsDeprecated",
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
      numberOfObsoleteDiscussions: events.length,
    };
  });

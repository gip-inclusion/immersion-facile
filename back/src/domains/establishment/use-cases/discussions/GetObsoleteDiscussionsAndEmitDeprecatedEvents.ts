import { z } from "zod";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { createTransactionalUseCase } from "../../../core/UseCase";

export type GetObsoleteDiscussionsAndEmitDeprecatedEvents = ReturnType<
  typeof makeGetObsoleteDiscussionsAndEmitDeprecatedEvent
>;

export const makeGetObsoleteDiscussionsAndEmitDeprecatedEvent =
  createTransactionalUseCase<
    void,
    { numberOfObsoleteDiscussions: number },
    void,
    {
      timeGateway: TimeGateway;
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
      createNewEvent: CreateNewEvent;
    }
  >(
    {
      name: "GetObsoleteDiscussionsAndEmitDeprecatedEvents",
      inputSchema: z.void(),
    },
    async ({ uow, deps }) => {
      const obsoleteDiscussions =
        await uow.discussionRepository.getObsoleteDiscussions({
          now: deps.timeGateway.now(),
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

      await Promise.all(
        events.map((event) => uow.outboxRepository.save(event)),
      );

      return {
        numberOfObsoleteDiscussions: events.length,
      };
    },
  );

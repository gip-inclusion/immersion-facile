import {
  Notification,
  NotificationContent,
  NotificationId,
  NotificationKind,
} from "shared";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";

export type WithNotificationIdAndKind = {
  id: NotificationId;
  kind: NotificationKind;
};

export type SaveNotificationAndRelatedEvent = ReturnType<
  typeof makeSaveNotificationAndRelatedEvent
>;
export const makeSaveNotificationAndRelatedEvent =
  (
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
    createNewEvent: CreateNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    }),
  ) =>
  async (
    uow: UnitOfWork,
    notificationContent: NotificationContent &
      Pick<Notification, "followedIds">,
  ): Promise<Notification> => {
    const now = timeGateway.now().toISOString();

    const notification: Notification = {
      ...notificationContent,
      id: uuidGenerator.new(),
      createdAt: now,
    };

    const event = createNewEvent({
      topic: "NotificationAdded",
      occurredAt: now,
      payload: {
        id: notification.id,
        kind: notification.kind,
      },
    });

    await Promise.all([
      uow.notificationRepository.save(notification),
      uow.outboxRepository.save(event),
    ]);

    return notification;
  };

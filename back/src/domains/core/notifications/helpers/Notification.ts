import type {
  Notification,
  NotificationContent,
  NotificationId,
  NotificationKind,
} from "shared";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";

export type WithNotificationIdAndKind = {
  id: NotificationId;
  kind: NotificationKind;
};

export type NotificationContentAndFollowedIds = NotificationContent &
  Pick<Notification, "followedIds">;

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
    notificationContent: NotificationContentAndFollowedIds,
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

export type SaveNotificationsBatchAndRelatedEvent = ReturnType<
  typeof makeSaveNotificationsBatchAndRelatedEvent
>;
export const makeSaveNotificationsBatchAndRelatedEvent =
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
    notificationsContent: NotificationContentAndFollowedIds[],
  ): Promise<Notification[]> => {
    const now = timeGateway.now().toISOString();

    const notifications = notificationsContent.map((content) => ({
      ...content,
      id: uuidGenerator.new(),
      createdAt: now,
    }));

    const event = createNewEvent({
      topic: "NotificationBatchAdded",
      occurredAt: now,
      payload: notifications.map((notification) => ({
        id: notification.id,
        kind: notification.kind,
      })),
    });

    await Promise.all([
      uow.notificationRepository.saveBatch(notifications),
      uow.outboxRepository.save(event),
    ]);

    return notifications;
  };

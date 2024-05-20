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

type NotificationContentAndFollowedIds = NotificationContent &
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
    notificationContent: NotificationContentAndFollowedIds[],
  ): Promise<Notification[]> => {
    const now = timeGateway.now().toISOString();

    const notifications = notificationContent.map((content) => ({
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

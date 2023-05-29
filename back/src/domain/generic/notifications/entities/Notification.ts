import { Flavor, TemplatedEmail, TemplatedSms } from "shared";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import { DateStr, TimeGateway } from "../../../core/ports/TimeGateway";
import { UnitOfWork } from "../../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../../core/ports/UuidGenerator";

export type NotificationId = Flavor<string, "NotificationId">;

export type FollowedIds = {
  conventionId?: string;
  establishmentSiret?: string;
  agencyId?: string;
};

export type NotificationContent =
  | { kind: "email"; templatedContent: TemplatedEmail }
  | { kind: "sms"; templatedContent: TemplatedSms };

export type Notification = {
  id: NotificationId;
  createdAt: DateStr;
  followedIds: FollowedIds;
} & NotificationContent;

export type SmsNotification = Extract<Notification, { kind: "sms" }>;
export type EmailNotification = Extract<Notification, { kind: "email" }>;

export type NotificationKind = Notification["kind"];

export type WithNotificationIdAndKind = {
  id: NotificationId;
  kind: NotificationKind;
};

export type SaveNotificationAndRelatedEvent = ReturnType<
  typeof makeSaveNotificationAndRelatedEvent
>;
export const makeSaveNotificationAndRelatedEvent =
  (
    createNewEvent: CreateNewEvent,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
  ) =>
  async (
    uow: UnitOfWork,
    notificationContent: NotificationContent &
      Pick<Notification, "followedIds">,
  ): Promise<void> => {
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
  };

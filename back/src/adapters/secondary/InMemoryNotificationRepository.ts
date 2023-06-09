import {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  SmsNotification,
} from "shared/src/notifications/notifications.dto";
import { NotificationRepository } from "../../domain/generic/notifications/ports/NotificationRepository";

export class InMemoryNotificationRepository implements NotificationRepository {
  async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    return this.notifications
      .filter((notification) => notification.kind === kind)
      .find((notification) => notification.id === id);
  }

  async save(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }

  async getLastNotifications() {
    return {
      emails: this.notifications.filter(
        (notification): notification is EmailNotification =>
          notification.kind === "email",
      ),
      sms: this.notifications.filter(
        (notification): notification is SmsNotification =>
          notification.kind === "sms",
      ),
    };
  }

  // for tests purposes
  public notifications: Notification[] = [];
}

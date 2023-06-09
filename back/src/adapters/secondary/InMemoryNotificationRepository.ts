import {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  SmsNotification,
} from "shared";
import {
  EmailNotificationFilters,
  NotificationRepository,
} from "../../domain/generic/notifications/ports/NotificationRepository";

export class InMemoryNotificationRepository implements NotificationRepository {
  async getEmailsByFilters(filters: EmailNotificationFilters) {
    return this.notifications.filter(
      (notification): notification is EmailNotification => {
        if (notification.kind !== "email") return false;
        if (!notification.templatedContent.recipients.includes(filters.email))
          return false;
        if (notification.templatedContent.type !== filters.emailKind)
          return false;
        return new Date(notification.createdAt) > filters.since;
      },
    );
  }

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

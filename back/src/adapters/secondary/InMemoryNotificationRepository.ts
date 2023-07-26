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
  // for tests purposes
  public notifications: Notification[] = [];

  public deleteAllEmailAttachements(): Promise<number> {
    throw new Error("Not implemented");
  }

  async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    return this.notifications
      .filter((notification) => notification.kind === kind)
      .find((notification) => notification.id === id);
  }

  async getEmailsByFilters(filters: EmailNotificationFilters = {}) {
    return this.notifications.filter(
      (notification): notification is EmailNotification => {
        if (notification.kind !== "email") return false;

        if (
          filters.email &&
          !notification.templatedContent.recipients.includes(filters.email)
        )
          return false;

        if (
          filters.emailKind &&
          notification.templatedContent.kind !== filters.emailKind
        )
          return false;

        return filters.since
          ? new Date(notification.createdAt) > filters.since
          : true;
      },
    );
  }

  async getLastNotifications() {
    return {
      emails: await this.getEmailsByFilters(),
      sms: this.notifications.filter(
        (notification): notification is SmsNotification =>
          notification.kind === "sms",
      ),
    };
  }

  async save(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }
}

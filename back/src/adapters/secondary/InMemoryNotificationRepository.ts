import {
  Notification,
  NotificationId,
  NotificationKind,
} from "../../domain/generic/notifications/entities/Notification";
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

  // for tests purposes
  public notifications: Notification[] = [];
}

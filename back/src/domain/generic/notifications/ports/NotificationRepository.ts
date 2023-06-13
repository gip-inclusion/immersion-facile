import { EmailNotification, SmsNotification } from "shared";
import { Notification, NotificationId, NotificationKind } from "shared";

export interface NotificationRepository {
  save: (notification: Notification) => Promise<void>;
  getByIdAndKind: (
    id: NotificationId,
    kind: NotificationKind,
  ) => Promise<Notification | undefined>;
  getLastNotifications: () => Promise<{
    emails: EmailNotification[];
    sms: SmsNotification[];
  }>;
}

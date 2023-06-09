import { Email, EmailType } from "shared";
import {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  SmsNotification,
} from "shared";

export type EmailNotificationFilters = {
  email?: Email;
  since?: Date;
  emailKind?: EmailType;
};

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
  getEmailsByFilters: (
    filters?: EmailNotificationFilters,
  ) => Promise<EmailNotification[]>;
}

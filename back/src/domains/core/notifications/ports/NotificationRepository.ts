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
  getSmsByIds: (ids: NotificationId[]) => Promise<SmsNotification[]>;
  getEmailsByIds: (ids: NotificationId[]) => Promise<EmailNotification[]>;
  save: (notification: Notification) => Promise<void>;
  saveBatch: (notifications: Notification[]) => Promise<void>;
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
  deleteAllEmailAttachements: () => Promise<number>;
}

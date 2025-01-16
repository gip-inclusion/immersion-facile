import { Email, EmailParamsByEmailType, EmailType } from "shared";
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
  getEmailsByKindAndAroundCreatedAt: (
    kind: keyof EmailParamsByEmailType,
    createdAt: Date,
  ) => Promise<EmailNotification[]>;
  getLastNotifications: () => Promise<{
    emails: EmailNotification[];
    sms: SmsNotification[];
  }>;
  getEmailsByFilters: () => Promise<EmailNotification[]>;
  deleteAllEmailAttachements: () => Promise<number>;
}

import type {
  ConventionId,
  Email,
  EmailType,
  Phone,
  TemplatedSms,
} from "shared";
import type {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  SmsNotification,
} from "shared";

export type EmailNotificationFilters = {
  email: Email;
  emailType: EmailType;
  conventionId?: ConventionId;
};

export type SmsNotificationFilters = {
  recipientPhoneNumber: Phone;
  conventionId: ConventionId;
  smsKind: TemplatedSms["kind"];
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
  getLastEmailsByFilters: (
    filters?: EmailNotificationFilters,
  ) => Promise<EmailNotification[]>;
  deleteAllEmailAttachements: () => Promise<number>;
  getLastSmsNotificationByFilter: (
    filters: SmsNotificationFilters,
  ) => Promise<SmsNotification | undefined>;
}

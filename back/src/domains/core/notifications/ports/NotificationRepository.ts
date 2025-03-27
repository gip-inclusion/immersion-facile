import type {
  ConventionId,
  Email,
  EmailNotification,
  EmailType,
  Notification,
  NotificationErrored,
  NotificationId,
  NotificationKind,
  Phone,
  SmsNotification,
  TemplatedSms,
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
  markErrored: (params: {
    notificationId: NotificationId;
    notificationKind: NotificationKind;
    errored: NotificationErrored | null;
  }) => Promise<void>;
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

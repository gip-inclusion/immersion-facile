import type {
  ConventionId,
  Email,
  EmailNotification,
  EmailType,
  Notification,
  NotificationId,
  NotificationKind,
  NotificationState,
  PhoneNumber,
  SmsNotification,
  TemplatedSms,
} from "shared";

export type EmailNotificationFilters = {
  email?: Email;
  emailType?: EmailType;
  conventionId?: ConventionId;
  createdAt?: Date;
};

export type SmsNotificationFilters = {
  recipientPhoneNumber: PhoneNumber;
  conventionId: ConventionId;
  smsKind: TemplatedSms["kind"];
};

export interface NotificationRepository {
  getSmsByIds: (ids: NotificationId[]) => Promise<SmsNotification[]>;
  getEmailsByIds: (ids: NotificationId[]) => Promise<EmailNotification[]>;
  save: (notification: Notification) => Promise<void>;
  updateState: (params: {
    notificationId: NotificationId;
    notificationKind: NotificationKind;
    state: NotificationState | undefined;
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
  getEmailsByFilters: (
    filters: EmailNotificationFilters,
  ) => Promise<EmailNotification[]>;
  deleteAllEmailAttachements: () => Promise<number>;
  getLastSmsNotificationByFilter: (
    filters: SmsNotificationFilters,
  ) => Promise<SmsNotification | undefined>;
}

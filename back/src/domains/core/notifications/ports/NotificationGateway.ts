import type {
  Flavor,
  NotificationId,
  TemplatedEmail,
  TemplatedSms,
} from "shared";

export type Base64 = Flavor<string, "Base64">;

export type SendNotificationResult =
  | { isOk: true; messageIds: (string | number)[] }
  | { isOk: false; error: { message: string; httpStatus: number } };

export interface NotificationGateway {
  sendEmail(
    templatedEmail: TemplatedEmail,
    notificationId?: NotificationId,
  ): Promise<SendNotificationResult>;
  sendSms(
    sendSmsParams: TemplatedSms,
    notificationId?: NotificationId,
  ): Promise<SendNotificationResult>;
  getAttachmentContent(downloadToken: string): Promise<Base64 | null>;
}

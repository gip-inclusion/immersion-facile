import { Flavor, NotificationId, TemplatedEmail, TemplatedSms } from "shared";

export type Base64 = Flavor<string, "Base64">;

export interface NotificationGateway {
  sendEmail(
    templatedEmail: TemplatedEmail,
    notificationId?: NotificationId,
  ): Promise<void>;
  sendSms(
    sendSmsParams: TemplatedSms,
    notificationId?: NotificationId,
  ): Promise<void>;
  getAttachmentContent(downloadToken: string): Promise<Base64 | null>;
}

import { NotificationId, TemplatedEmail, TemplatedSms } from "shared";

export interface NotificationGateway {
  sendEmail(
    templatedEmail: TemplatedEmail,
    notificationId?: NotificationId,
  ): Promise<void>;
  sendSms(
    sendSmsParams: TemplatedSms,
    notificationId?: NotificationId,
  ): Promise<void>;
  getAttachmentContent(downloadToken: string): Promise<Buffer>;
}

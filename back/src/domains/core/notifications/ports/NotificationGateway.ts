import type { ResultAsync } from "neverthrow";
import type {
  BadRequestError,
  Flavor,
  HttpErrorResponseBody,
  NotificationId,
  TemplatedEmail,
  TemplatedSms,
} from "shared";

export type Base64 = Flavor<string, "Base64">;

export interface NotificationGateway {
  sendEmail(
    templatedEmail: TemplatedEmail,
    notificationId?: NotificationId,
  ): ResultAsync<void, HttpErrorResponseBody | BadRequestError>;
  sendSms(
    sendSmsParams: TemplatedSms,
    notificationId?: NotificationId,
  ): ResultAsync<void, HttpErrorResponseBody>;
  getAttachmentContent(downloadToken: string): Promise<Base64 | null>;
}

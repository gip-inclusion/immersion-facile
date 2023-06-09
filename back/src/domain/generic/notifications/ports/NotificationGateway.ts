import { TemplatedEmail, TemplatedSms } from "shared";

export interface NotificationGateway {
  sendEmail(templatedEmail: TemplatedEmail): Promise<void>;
  sendSms(sendSmsParams: TemplatedSms): Promise<void>;
}

import { EmailSentDto, TemplatedEmail, TemplatedSms } from "shared";

export interface NotificationGateway {
  getLastSentEmailDtos(): EmailSentDto[];
  sendEmail(templatedEmail: TemplatedEmail): Promise<void>;
  sendSms(sendSmsParams: TemplatedSms): Promise<void>;
}

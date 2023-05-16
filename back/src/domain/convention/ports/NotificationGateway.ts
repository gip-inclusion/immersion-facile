import { AbsoluteUrl, EmailSentDto, Flavor, TemplatedEmail } from "shared";
import { ReminderKind } from "../../core/eventsPayloads/ConventionReminderPayload";

export type SmsContent = Flavor<string, "SmsContent">;
export type Phone = Flavor<string, "Phone">;

export type SendSmsParams = {
  phone: Phone;
  kind: ReminderKind;
  shortLink: AbsoluteUrl;
};

export interface NotificationGateway {
  getLastSentEmailDtos(): EmailSentDto[];
  sendEmail(templatedEmail: TemplatedEmail): Promise<void>;
  sendSms(sendSmsParams: SendSmsParams): Promise<void>;
}

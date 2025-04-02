import { prop } from "ramda";
import {
  type DateString,
  type TemplatedEmail,
  type TemplatedSms,
  errors,
} from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type {
  Base64,
  NotificationGateway,
  SendNotificationResult,
} from "../ports/NotificationGateway";

export const sendSmsErrorPhoneNumber = "0699999999";
export const emailThatTriggerSendEmailError =
  "email-that-triggers-send-email-error@mail.com";
export const fakeHttpStatusErrorCode = 555;

export class InMemoryNotificationGateway implements NotificationGateway {
  public attachmentsByLinks: Partial<Record<string, Base64>> = {
    default: "",
  };

  readonly #sentEmails: {
    templatedEmail: TemplatedEmail;
    sentAt: DateString;
  }[] = [];

  readonly #sentSms: TemplatedSms[] = [];

  constructor(
    private readonly timeGateway: TimeGateway = new CustomTimeGateway(),
    private readonly numberOfEmailToKeep: number | null = null,
  ) {}

  public async getAttachmentContent(link: string): Promise<Base64 | null> {
    const attachment = this.attachmentsByLinks[link];
    if (!attachment)
      throw errors.generic.fakeError(`No attachment found by link ${link}.`);
    if (attachment === "not-a-blob") return null;
    return attachment;
  }

  // For testing.
  public getSentEmails(): TemplatedEmail[] {
    return this.#sentEmails.map(prop("templatedEmail"));
  }

  public getSentSms(): TemplatedSms[] {
    return this.#sentSms;
  }

  public async sendEmail(
    templatedEmail: TemplatedEmail,
  ): Promise<SendNotificationResult> {
    if (templatedEmail.recipients.includes(emailThatTriggerSendEmailError)) {
      return {
        isOk: false,
        error: {
          message: `fake Send Email Error with email ${emailThatTriggerSendEmailError}`,
          httpStatus: fakeHttpStatusErrorCode,
        },
      };
    }
    this.#pushEmail(templatedEmail);
    return { isOk: true };
  }

  public async sendSms(sms: TemplatedSms): Promise<SendNotificationResult> {
    if (sms.recipientPhone === `33${sendSmsErrorPhoneNumber.substring(1)}`) {
      return {
        isOk: false,
        error: {
          message: `fake Send SMS Error with phone number ${sms.recipientPhone}.`,
          httpStatus: fakeHttpStatusErrorCode,
        },
      };
    }

    this.#sentSms.push(sms);
    return { isOk: true };
  }

  #pushEmail(templatedEmail: TemplatedEmail) {
    const numberOfEmailsToDrop = this.numberOfEmailToKeep
      ? this.#sentEmails.length + 1 - this.numberOfEmailToKeep
      : 0;

    if (numberOfEmailsToDrop > 0) {
      this.#sentEmails.splice(0, numberOfEmailsToDrop);
    }

    this.#sentEmails.push({
      templatedEmail,
      sentAt: this.timeGateway.now().toISOString(),
    });
  }
}

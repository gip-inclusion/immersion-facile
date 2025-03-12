import { prop } from "ramda";
import type { DateString, TemplatedEmail, TemplatedSms } from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type { Base64, NotificationGateway } from "../ports/NotificationGateway";

export const sendSmsErrorPhoneNumber = "0699999999";
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
    if (!attachment) throw new Error(`No attachment found by link ${link}.`);
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

  public async sendEmail(templatedEmail: TemplatedEmail): Promise<void> {
    this.#pushEmail(templatedEmail);
  }

  public async sendSms(sms: TemplatedSms): Promise<void> {
    if (sms.recipientPhone === `33${sendSmsErrorPhoneNumber.substring(1)}`)
      throw new Error(
        `Send SMS Error with phone number ${sms.recipientPhone}.`,
      );
    this.#sentSms.push(sms);
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

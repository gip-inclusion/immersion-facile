import { prop } from "ramda";
import { DateString, TemplatedEmail, TemplatedSms } from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { NotificationGateway } from "../ports/NotificationGateway";

export const sendSmsErrorPhoneNumber = "0699999999";
export class InMemoryNotificationGateway implements NotificationGateway {
  public attachment: Buffer = Buffer.from("");

  readonly #sentEmails: {
    templatedEmail: TemplatedEmail;
    sentAt: DateString;
  }[] = [];

  readonly #sentSms: TemplatedSms[] = [];

  constructor(
    private readonly timeGateway: TimeGateway = new CustomTimeGateway(),
    private readonly numberOfEmailToKeep: number | null = null,
  ) {}

  public async getAttachmentContent(_downloadToken: string): Promise<Buffer> {
    return this.attachment;
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

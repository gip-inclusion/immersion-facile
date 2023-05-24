import { prop } from "ramda";
import { EmailSentDto, TemplatedEmail } from "shared";
import {
  NotificationGateway,
  SendSmsParams,
} from "../../../domain/convention/ports/NotificationGateway";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import { createLogger } from "../../../utils/logger";
import { CustomTimeGateway } from "../core/TimeGateway/CustomTimeGateway";

const logger = createLogger(__filename);
export const sendSmsErrorPhoneNumber = "0699999999";
export class InMemoryNotificationGateway implements NotificationGateway {
  public constructor(
    private readonly timeGateway: TimeGateway = new CustomTimeGateway(),
    private readonly numberOfEmailToKeep: number | null = null,
  ) {}
  public getLastSentEmailDtos(): EmailSentDto[] {
    return this.sentEmails.sort((mailA, mailB) =>
      new Date(mailB.sentAt).getTime() - new Date(mailA.sentAt).getTime() >= 0
        ? 1
        : -1,
    );
  }

  public async sendEmail(templatedEmail: TemplatedEmail): Promise<void> {
    logger.info(
      templatedEmail.params,
      `sending email : ${templatedEmail.type}`,
    );
    this.pushEmail(templatedEmail);
  }

  private pushEmail(templatedEmail: TemplatedEmail) {
    const numberOfEmailsToDrop = this.numberOfEmailToKeep
      ? this.sentEmails.length + 1 - this.numberOfEmailToKeep
      : 0;

    if (numberOfEmailsToDrop > 0) {
      this.sentEmails.splice(0, numberOfEmailsToDrop);
    }

    this.sentEmails.push({
      templatedEmail,
      sentAt: this.timeGateway.now().toISOString(),
    });
  }

  public async sendSms(sendSmsParams: SendSmsParams): Promise<void> {
    if (sendSmsParams.phone === "33" + sendSmsErrorPhoneNumber.substring(1))
      throw new Error(
        `Send SMS Error with phone number ${sendSmsParams.phone}.`,
      );
    this.sentSms.push(sendSmsParams);
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails.map(prop("templatedEmail"));
  }
  getSentSms(): SendSmsParams[] {
    return this.sentSms;
  }

  private readonly sentEmails: EmailSentDto[] = [];
  private readonly sentSms: SendSmsParams[] = [];
}

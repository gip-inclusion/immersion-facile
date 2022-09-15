import { prop } from "ramda";
import { EmailSentDto, TemplatedEmail } from "shared/src/email/email";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { Clock } from "../../../domain/core/ports/Clock";
import { createLogger } from "../../../utils/logger";
import { CustomClock } from "../core/ClockImplementations";

const logger = createLogger(__filename);

export class InMemoryEmailGateway implements EmailGateway {
  public constructor(
    private readonly clock: Clock = new CustomClock(),
    private readonly numberOfEmailToKeep: number | null = null,
  ) {}

  private readonly sentEmails: EmailSentDto[] = [];

  public getLastSentEmailDtos() {
    return this.sentEmails.sort((mailA, mailB) =>
      new Date(mailB.sentAt).getTime() - new Date(mailA.sentAt).getTime() >= 0
        ? 1
        : -1,
    );
  }

  public async sendEmail(email: TemplatedEmail) {
    logger.info(email.params, `sending email : ${email.type}`);
    this.pushEmail(email);
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
      sentAt: this.clock.now().toISOString(),
    });
  }

  // For testing.
  getSentEmails(): TemplatedEmail[] {
    return this.sentEmails.map(prop("templatedEmail"));
  }
}

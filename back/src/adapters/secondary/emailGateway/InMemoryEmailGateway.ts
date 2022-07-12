import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { createLogger } from "../../../utils/logger";
import { EmailSentDto, TemplatedEmail } from "shared/email";
import { Clock } from "../../../domain/core/ports/Clock";
import { prop } from "ramda";
import { CustomClock } from "../core/ClockImplementations";

const logger = createLogger(__filename);

export class InMemoryEmailGateway implements EmailGateway {
  public constructor(
    private readonly clock: Clock = new CustomClock(),
    private readonly numberOfEmailToKeep: number | null = null,
  ) {}

  private readonly sentEmails: EmailSentDto[] = [];

  public getLastSentEmailDtos() {
    return this.sentEmails.reverse();
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

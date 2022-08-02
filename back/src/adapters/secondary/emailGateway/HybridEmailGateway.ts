import { EmailSentDto, TemplatedEmail } from "shared/src/email/email";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { InMemoryEmailGateway } from "./InMemoryEmailGateway";
import { SendinblueEmailGateway } from "./SendinblueEmailGateway";

export class HybridEmailGateway implements EmailGateway {
  constructor(
    private sendinblue: SendinblueEmailGateway,
    private inMemory: InMemoryEmailGateway,
  ) {}

  async sendEmail(templatedEmail: TemplatedEmail): Promise<void> {
    await Promise.all([
      this.inMemory.sendEmail(templatedEmail),
      this.sendinblue.sendEmail(templatedEmail),
    ]);
  }

  getLastSentEmailDtos(): EmailSentDto[] {
    return this.inMemory.getLastSentEmailDtos();
  }
}

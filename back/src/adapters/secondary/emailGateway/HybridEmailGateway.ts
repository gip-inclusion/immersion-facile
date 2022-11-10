import { EmailSentDto, TemplatedEmail } from "shared";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { InMemoryEmailGateway } from "./InMemoryEmailGateway";

export class HybridEmailGateway implements EmailGateway {
  constructor(
    private sendinblue: EmailGateway,
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

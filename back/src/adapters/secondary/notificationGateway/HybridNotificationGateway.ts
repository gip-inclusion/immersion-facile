import { EmailSentDto, TemplatedEmail, TemplatedSms } from "shared";
import { NotificationGateway } from "../../../domain/convention/ports/NotificationGateway";
import { InMemoryNotificationGateway } from "./InMemoryNotificationGateway";

export class HybridNotificationGateway implements NotificationGateway {
  constructor(
    private brevo: NotificationGateway,
    private inMemory: InMemoryNotificationGateway,
  ) {}
  async sendSms(sms: TemplatedSms): Promise<void> {
    await Promise.all([this.inMemory.sendSms(sms), this.brevo.sendSms(sms)]);
  }

  async sendEmail(templatedEmail: TemplatedEmail): Promise<void> {
    await Promise.all([
      this.inMemory.sendEmail(templatedEmail),
      this.brevo.sendEmail(templatedEmail),
    ]);
  }

  getLastSentEmailDtos(): EmailSentDto[] {
    return this.inMemory.getLastSentEmailDtos();
  }
}

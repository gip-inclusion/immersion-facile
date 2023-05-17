import { EmailSentDto, TemplatedEmail } from "shared";
import {
  NotificationGateway,
  SendSmsParams,
} from "../../../domain/convention/ports/NotificationGateway";
import { InMemoryNotificationGateway } from "./InMemoryNotificationGateway";

export class HybridNotificationGateway implements NotificationGateway {
  constructor(
    private brevo: NotificationGateway,
    private inMemory: InMemoryNotificationGateway,
  ) {}
  async sendSms(sendSmsParams: SendSmsParams): Promise<void> {
    await Promise.all([
      this.inMemory.sendSms(sendSmsParams),
      this.brevo.sendSms(sendSmsParams),
    ]);
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

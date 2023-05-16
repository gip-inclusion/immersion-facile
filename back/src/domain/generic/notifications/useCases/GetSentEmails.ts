import { z } from "zod";
import { EmailSentDto } from "shared";
import { NotificationGateway } from "../../../convention/ports/NotificationGateway";
import { UseCase } from "../../../core/UseCase";

export class GetSentEmails extends UseCase<void, EmailSentDto[]> {
  constructor(private notificationGateway: NotificationGateway) {
    super();
  }

  inputSchema = z.void();

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _execute(): Promise<EmailSentDto[]> {
    return this.notificationGateway.getLastSentEmailDtos();
  }
}

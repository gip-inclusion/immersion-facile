import { z } from "zod";

import { EmailSentDto } from "shared";

import { EmailGateway } from "../../../convention/ports/EmailGateway";
import { UseCase } from "../../../core/UseCase";

export class GetSentEmails extends UseCase<void, EmailSentDto[]> {
  constructor(private emailGateway: EmailGateway) {
    super();
  }

  inputSchema = z.void();

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _execute(): Promise<EmailSentDto[]> {
    return this.emailGateway.getLastSentEmailDtos();
  }
}

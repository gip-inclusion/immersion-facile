import { z } from "zod";
import { TemplatedEmail } from "../../../../adapters/secondary/InMemoryEmailGateway";
import { EmailGateway } from "../../../convention/ports/EmailGateway";
import { UseCase } from "../../../core/UseCase";

export class GetSentEmails extends UseCase<void, TemplatedEmail[]> {
  constructor(private emailGateway: EmailGateway) {
    super();
  }

  inputSchema = z.void();

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _execute(): Promise<TemplatedEmail[]> {
    return this.emailGateway.getLastSentEmails();
  }
}

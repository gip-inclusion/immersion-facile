import { z } from "zod";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

// prettier-ignore
export type RenewMagicLinkPayload = z.infer<typeof renewMagicLinkPayloadSchema>
export const renewMagicLinkPayloadSchema = z.object({
  emails: z.array(z.string()),
  magicLink: z.string(),
  conventionStatusLink: z.string(),
});

export class DeliverRenewedMagicLink extends UseCase<RenewMagicLinkPayload> {
  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }

  inputSchema = renewMagicLinkPayloadSchema;

  public async _execute({
    emails,
    magicLink,
    conventionStatusLink,
  }: RenewMagicLinkPayload): Promise<void> {
    await this.emailGateway.sendEmail({
      type: "MAGIC_LINK_RENEWAL",
      recipients: emails,
      params: { magicLink, conventionStatusLink },
    });
  }
}

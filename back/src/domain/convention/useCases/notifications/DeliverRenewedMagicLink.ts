import { z } from "zod";

import { InternshipKind, internshipKindSchema } from "shared";

import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

// prettier-ignore
export type RenewMagicLinkPayload  = {
  internshipKind:InternshipKind
  emails:string[]
  magicLink:string,
  conventionStatusLink:string
}
export const renewMagicLinkPayloadSchema: z.Schema<RenewMagicLinkPayload> =
  z.object({
    internshipKind: internshipKindSchema,
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
    internshipKind,
  }: RenewMagicLinkPayload): Promise<void> {
    await this.emailGateway.sendEmail({
      type: "MAGIC_LINK_RENEWAL",
      recipients: emails,
      params: { internshipKind, magicLink, conventionStatusLink },
    });
  }
}

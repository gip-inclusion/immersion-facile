import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import {
  RenewMagicLinkPayload,
  renewMagicLinkPayloadSchema,
} from "./NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";

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

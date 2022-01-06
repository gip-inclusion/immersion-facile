import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import {
  RenewMagicLinkPayload,
  renewMagicLinkPayloadSchema,
} from "./NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";

const logger = createLogger(__filename);
export class DeliverRenewedMagicLink extends UseCase<RenewMagicLinkPayload> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
  ) {
    super();
  }

  inputSchema = renewMagicLinkPayloadSchema;

  public async _execute({
    emails,
    magicLink,
  }: RenewMagicLinkPayload): Promise<void> {
    logger.info({ emails, magicLink }, "------------- Entering execute.");
    await this.emailFilter.withAllowedRecipients(
      emails,
      (emails) => this.emailGateway.sendRenewedMagicLink(emails, { magicLink }),
      logger,
    );
  }
}

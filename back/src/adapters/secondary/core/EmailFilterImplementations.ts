import { Logger } from "pino";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";

export class AllowListEmailFilter implements EmailFilter {
  private readonly allowedEmails: Set<string>;

  constructor(allowedEmailList: string[]) {
    this.allowedEmails = new Set(allowedEmailList);
  }

  public async withAllowedRecipients(
    recipients: string[],
    sendCb: (recipients: string[]) => Promise<void>,
    logger: Logger,
  ): Promise<void> {
    const allowedRecipients = recipients.filter((email) => {
      if (this.allowedEmails.has(email)) {
        return true;
      } else {
        logger.info(`Skipped sending email to: ${email}`);
        return false;
      }
    });

    if (allowedRecipients.length == 0) {
      logger.info("No allowed recipients. Email sending skipped.");
      return;
    }

    return sendCb(allowedRecipients);
  }
}

export class AlwaysAllowEmailFilter implements EmailFilter {
  public async withAllowedRecipients(
    unfilteredRecipients: string[],
    sendCb: (recipients: string[]) => Promise<void>,
    _logger: Logger,
  ) {
    return sendCb(unfilteredRecipients);
  }
}

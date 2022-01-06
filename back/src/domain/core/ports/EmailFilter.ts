import { Logger } from "pino";

export interface EmailFilter {
  withAllowedRecipients: (
    unfilteredRecipients: string[],
    sendCb: (recipients: string[]) => Promise<void>,
    logger: Logger,
  ) => Promise<void>;
}

import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

const triggerEstablishmentLeadFirstReminder = async () => {
  logger.info("Starting to send Emails to establishment leads");

  const sendEmails = new SendEstablishmentLeadReminder();

  sendEmails.execute();
};

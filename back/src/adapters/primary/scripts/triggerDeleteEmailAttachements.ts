import { Pool } from "pg";
import { createLogger } from "../../../utils/logger";
import { PgNotificationRepository } from "../../secondary/pg/PgNotificationRepository";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeTriggerDeleteEmailAttachements = async () => {
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();

  const pgNotificationRepository = new PgNotificationRepository(client);
  const numberOfDeletedAttachements =
    await pgNotificationRepository.deleteAllEmailAttachements();

  client.release();
  await pool.end();

  return {
    numberOfDeletedAttachements,
  };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "conventionReminderScript",
  config,
  executeTriggerDeleteEmailAttachements,
  ({ numberOfDeletedAttachements }) =>
    `Deleted : ${numberOfDeletedAttachements} attachements`,
  logger,
);

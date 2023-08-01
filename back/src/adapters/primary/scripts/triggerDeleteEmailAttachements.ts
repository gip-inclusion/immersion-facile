import { Pool } from "pg";
import { createLogger } from "../../../utils/logger";
import { PgNotificationRepository } from "../../secondary/pg/PgNotificationRepository";
import { makeKyselyDb } from "../../secondary/pg/sql/database";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeTriggerDeleteEmailAttachements = async () => {
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const pgNotificationRepository = new PgNotificationRepository(
    makeKyselyDb(pool),
  );

  const numberOfDeletedAttachements =
    await pgNotificationRepository.deleteAllEmailAttachements();

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

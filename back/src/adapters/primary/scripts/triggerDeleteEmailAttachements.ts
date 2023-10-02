import { Pool } from "pg";
import { createLogger } from "../../../utils/logger";
import { makeKyselyDb } from "../../secondary/pg/kysely/kyselyUtils";
import { PgNotificationRepository } from "../../secondary/pg/repositories/PgNotificationRepository";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeTriggerDeleteEmailAttachements = async () => {
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const kyselyDb = makeKyselyDb(pool);

  const pgNotificationRepository = new PgNotificationRepository(kyselyDb);
  const numberOfDeletedAttachements =
    await pgNotificationRepository.deleteAllEmailAttachements();

  await kyselyDb.destroy();
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

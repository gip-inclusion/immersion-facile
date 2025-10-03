import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { PgNotificationRepository } from "../domains/core/notifications/adapters/PgNotificationRepository";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeTriggerDeleteEmailAttachements = async () => {
  const pool = createMakeProductionPgPool(config)();
  const client = await pool.connect();

  const numberOfDeletedAttachements = await new PgNotificationRepository(
    makeKyselyDb(pool),
  ).deleteAllEmailAttachements();

  await client.release();
  await pool.end();

  return {
    numberOfDeletedAttachements,
  };
};

handleCRONScript(
  "deleteEmailAttachements",
  config,
  executeTriggerDeleteEmailAttachements,
  ({ numberOfDeletedAttachements }) =>
    `Deleted : ${numberOfDeletedAttachements} attachements`,
  logger,
);

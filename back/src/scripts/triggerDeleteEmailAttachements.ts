import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { PgNotificationRepository } from "../domains/core/notifications/adapters/PgNotificationRepository";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeTriggerDeleteEmailAttachements = async () => {
  const pool = createGetPgPoolFn(config)();
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

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "deleteEmailAttachements",
  config,
  executeTriggerDeleteEmailAttachements,
  ({ numberOfDeletedAttachements }) =>
    `Deleted : ${numberOfDeletedAttachements} attachements`,
  logger,
);

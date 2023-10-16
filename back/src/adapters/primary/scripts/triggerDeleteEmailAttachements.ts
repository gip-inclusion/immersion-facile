import { createLogger } from "../../../utils/logger";
import { makeKyselyDb } from "../../secondary/pg/kysely/kyselyUtils";
import { PgNotificationRepository } from "../../secondary/pg/repositories/PgNotificationRepository";
import { AppConfig } from "../config/appConfig";
import { createGetPgPoolFn } from "../config/createGateways";
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

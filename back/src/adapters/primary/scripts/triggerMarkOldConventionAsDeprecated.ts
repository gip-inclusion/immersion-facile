import { subMonths } from "date-fns";
import { Pool } from "pg";
import { createLogger } from "../../../utils/logger";
import { makeKyselyDb } from "../../secondary/pg/kysely/kyselyUtils";
import { PgConventionRepository } from "../../secondary/pg/repositories/PgConventionRepository";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const triggerMarkOldConventionAsDeprecated = async () => {
  const dbUrl = config.pgImmersionDbUrl;

  const pool = new Pool({
    connectionString: dbUrl,
  });

  const conventionRepository = new PgConventionRepository(makeKyselyDb(pool));

  const deprecateSince = subMonths(new Date(), 2);

  const numberOfUpdatedConventions =
    await conventionRepository.deprecateConventionsWithoutDefinitiveStatusEndedSince(
      deprecateSince,
    );

  return { numberOfUpdatedConventions };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "triggerMarkOldConventionAsDeprecated",
  config,
  triggerMarkOldConventionAsDeprecated,
  ({ numberOfUpdatedConventions }) =>
    `Marked ${numberOfUpdatedConventions} as deprecated`,
  logger,
);

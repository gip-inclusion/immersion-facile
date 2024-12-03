import { subMonths } from "date-fns";
import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { PgConventionRepository } from "../domains/convention/adapters/PgConventionRepository";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const triggerMarkOldConventionAsDeprecated = async () => {
  const dbUrl = config.pgImmersionDbUrl;

  const pool = new Pool({
    connectionString: dbUrl,
  });

  const conventionRepository = new PgConventionRepository(makeKyselyDb(pool));

  const deprecateSince = subMonths(new Date(), 1);

  const numberOfUpdatedConventions =
    await conventionRepository.deprecateConventionsWithoutDefinitiveStatusEndedSince(
      deprecateSince,
    );

  return { numberOfUpdatedConventions };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleCRONScript(
  "triggerMarkOldConventionAsDeprecated",
  config,
  triggerMarkOldConventionAsDeprecated,
  ({ numberOfUpdatedConventions }) =>
    `Marked ${numberOfUpdatedConventions} as deprecated`,
  logger,
);

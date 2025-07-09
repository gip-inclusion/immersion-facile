import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { PgDiscussionRepository } from "../domains/establishment/adapters/PgDiscussionRepository";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const triggerMarkObsoleteDiscussionsAsDeprecated = async () => {
  const dbUrl = config.pgImmersionDbUrl;

  const pool = new Pool({
    connectionString: dbUrl,
  });

  const discussionRepository = new PgDiscussionRepository(makeKyselyDb(pool));

  const numberOfUpdatedConventions =
    await discussionRepository.markObsoleteDiscussionsAsDeprecated({
      now: new Date(),
    });

  return { numberOfDeprecatedDiscussions: numberOfUpdatedConventions.length };
};

handleCRONScript(
  "triggerMarkObsoleteDiscussionsAsDeprecated",
  config,
  triggerMarkObsoleteDiscussionsAsDeprecated,
  ({ numberOfDeprecatedDiscussions }) =>
    `Marked ${numberOfDeprecatedDiscussions} as deprecated`,
  logger,
);

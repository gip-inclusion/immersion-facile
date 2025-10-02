import { Pool } from "pg";
import { errors } from "shared";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "../bootstrap/appConfig";

export type MakePgPool = () => Pool;

export const makeTestPgPool: MakePgPool = () => {
  const appConfig = AppConfig.createFromEnv();
  return new Pool({
    connectionString: appConfig.pgImmersionDbUrl,
  });
};

export const createMakeProductionPgPool = (
  config: Pick<
    AppConfig,
    "repositories" | "romeRepository" | "pgImmersionDbUrl"
  >,
): MakePgPool => {
  return () => {
    if (config.repositories !== "PG" && config.romeRepository !== "PG")
      throw errors.config.badConfig(`Unexpected pg pool creation: REPOSITORIES=${config.repositories},
       ROME_GATEWAY=${config.romeRepository}`);

    const { host, pathname } = new URL(config.pgImmersionDbUrl);
    const logger = createLogger(__filename);
    logger.info({
      message: `creating postgresql connection pool from host=${host} and pathname=${pathname}`,
    });

    return new Pool({
      connectionString: config.pgImmersionDbUrl,
      application_name: "Immersion Backend",
      max: 25,
      statement_timeout: 30_000,
      // statement_timeout is important as it avoids never ending queries.
      // We have had problems with eventBus not triggered due to never ending PG queries
    });
  };
};

export const createMakeScriptPgPool =
  (config: Pick<AppConfig, "pgImmersionDbUrl">): MakePgPool =>
  () =>
    new Pool({ connectionString: config.pgImmersionDbUrl });

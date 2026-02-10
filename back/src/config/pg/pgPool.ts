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
    | "repositories"
    | "romeRepository"
    | "pgImmersionDbUrl"
    | "pgTransactionIdleTimeoutMs"
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
      max: 50,
      statement_timeout: 30_000,
      // statement_timeout is important as it avoids never ending queries.
      // We have had problems with eventBus not triggered due to never ending PG queries

      idle_in_transaction_session_timeout: config.pgTransactionIdleTimeoutMs,
      // PG idle_in_transaction_session_timeout client config doc :
      // Terminate any session that has been idle (that is, waiting for a client query)
      // within an open transaction for longer than the specified amount of time.
      // If this value is specified without units, it is taken as milliseconds.
      // A value of zero (the default) disables the timeout.

      // This option can be used to ensure that idle sessions do not hold locks for an unreasonable amount of time.
      // Even when no significant locks are held, an open transaction prevents vacuuming away recently-dead
      // tuples that may be visible only to this transaction;
      // so remaining idle for a long time can contribute to table bloat.
    });
  };
};

export const createMakeScriptPgPool =
  (config: Pick<AppConfig, "pgImmersionDbUrl">): MakePgPool =>
  () =>
    new Pool({ connectionString: config.pgImmersionDbUrl });

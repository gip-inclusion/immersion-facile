import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { deactivateUnresponsiveEstablishmentsQuery } from "../domains/establishment/adapters/PgEstablishmentAggregateRepository.sql";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

type Report = { status: "success" } | { status: "error"; message: string };

const deactivateUnresponsiveEstablishments = async (): Promise<Report> => {
  const pool = new Pool({ connectionString: config.pgImmersionDbUrl });
  const db = makeKyselyDb(pool);

  return deactivateUnresponsiveEstablishmentsQuery(db)
    .then((): Report => ({ status: "success" }))
    .catch(
      (e): Report => ({
        status: "error",
        message: e.message,
      }),
    )
    .finally(() => pool.end());
};

handleCRONScript(
  "deactivateUnresponsiveEstablishments",
  config,
  deactivateUnresponsiveEstablishments,
  (report) =>
    report.status === "success"
      ? "Unresponsive establishments deactivated successfully"
      : `Error deactivating unresponsive establishments: ${report.message}`,
  logger,
);

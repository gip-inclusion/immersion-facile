import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { updateAllEstablishmentScoresQuery } from "../domains/establishment/adapters/PgEstablishmentAggregateRepository.sql";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

type Report = { status: "success" } | { status: "error"; message: string };

const updateScores = async (): Promise<Report> => {
  const pool = new Pool({ connectionString: config.pgImmersionDbUrl });
  const db = makeKyselyDb(pool);

  return updateAllEstablishmentScoresQuery(db)
    .then((): Report => ({ status: "success" }))
    .catch(
      (e): Report => ({
        status: "error",
        message: e.message,
      }),
    )
    .finally(() => pool.end());
};

handleEndOfScriptNotification(
  "updateAllEstablishmentsScores",
  config,
  updateScores,
  (report) =>
    report.status === "success"
      ? "Establishment score updated successfully"
      : `Error updating establishment scores : ${report.message}`,
  logger,
);

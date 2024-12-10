import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { PgEstablishmentAggregateRepository } from "../domains/establishment/adapters/PgEstablishmentAggregateRepository";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

type Report = { status: "success" } | { status: "error"; message: string };

const updateScores = async (): Promise<Report> => {
  const pool = new Pool({ connectionString: config.pgImmersionDbUrl });

  //TODO must have a usecase that updates aggragates score through save()
  return new PgEstablishmentAggregateRepository(makeKyselyDb(pool))
    .updateAllEstablishmentScores()
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
  "updateAllEstablishmentsScores",
  config,
  updateScores,
  (report) =>
    report.status === "success"
      ? "Establishment score updated successfully"
      : `Error updating establishment scores : ${report.message}`,
  logger,
);

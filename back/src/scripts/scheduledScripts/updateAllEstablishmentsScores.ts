import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../../config/pg/pgPool";
import { updateAllEstablishmentScoresQuery } from "../../domains/establishment/adapters/PgEstablishmentAggregateRepository.sql";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

type Report = { status: "success" } | { status: "error"; message: string };

const updateScores = async (): Promise<Report> => {
  const pool = createMakeScriptPgPool(config)();
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

export const triggerUpdateAllEstablishmentsScores = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "updateAllEstablishmentsScores",
    config,
    script: monitoredAsUseCase({
      name: "UpdateAllEstablishmentsScores",
      cb: updateScores,
    }),
    handleResults: (report) =>
      report.status === "success"
        ? "Establishment score updated successfully"
        : `Error updating establishment scores : ${report.message}`,
    logger,
    exitOnFinish,
  });

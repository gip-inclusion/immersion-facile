import { subYears } from "date-fns";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../../config/pg/pgPool";
import { PgConventionRepository } from "../../domains/convention/adapters/PgConventionRepository";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfYearsBeforeDeletion = 2;

const deleteOldConventions = async () => {
  const pool = createMakeScriptPgPool(config)();
  const db = makeKyselyDb(pool);
  const conventionRepository = new PgConventionRepository(db);

  const deleteAllConventionsBefore = subYears(
    new Date(),
    numberOfYearsBeforeDeletion,
  );

  const deletedConventionIds = await conventionRepository.deleteOldConventions(
    deleteAllConventionsBefore,
  );

  const numberOfConventionsDeleted = deletedConventionIds.length;

  return { numberOfConventionsDeleted };
};

export const triggerDeleteOldConventions = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldConventions",
    config,
    script: monitoredAsUseCase({
      name: "DeleteOldConventions",
      cb: deleteOldConventions,
    }),
    handleResults: ({ numberOfConventionsDeleted }) =>
      `${numberOfConventionsDeleted} conventions were deleted, because they were more than ${numberOfYearsBeforeDeletion} years old and had status DEPRECATED, CANCELLED, or REJECTED`,
    logger,
    exitOnFinish,
  });

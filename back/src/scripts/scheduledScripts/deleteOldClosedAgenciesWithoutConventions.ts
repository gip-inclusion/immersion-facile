import { subMonths } from "date-fns";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../../config/pg/pgPool";
import { PgAgencyRepository } from "../../domains/agency/adapters/PgAgencyRepository";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfMonthsBeforeDeletion = 3;

const deleteOldClosedAgenciesWithoutConventions = async () => {
  const pool = createMakeScriptPgPool(config)();
  const db = makeKyselyDb(pool);
  const agencyRepository = new PgAgencyRepository(db);

  const updatedBefore = subMonths(new Date(), numberOfMonthsBeforeDeletion);

  const deletedAgencyIds =
    await agencyRepository.deleteOldClosedAgenciesWithoutConventions({
      updatedBefore,
    });

  const numberOfAgenciesDeleted = deletedAgencyIds.length;

  return { numberOfAgenciesDeleted };
};

export const triggerDeleteOldClosedAgenciesWithoutConventions = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldClosedAgenciesWithoutConventions",
    config,
    script: monitoredAsUseCase({
      name: "DeleteOldClosedAgenciesWithoutConventions",
      cb: deleteOldClosedAgenciesWithoutConventions,
    }),
    handleResults: ({ numberOfAgenciesDeleted }) =>
      `${numberOfAgenciesDeleted} agencies were deleted, because they were more than ${numberOfMonthsBeforeDeletion} months old, had status closed or rejected, and had no conventions`,
    logger,
    exitOnFinish,
  });

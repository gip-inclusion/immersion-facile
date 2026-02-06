import { subDays } from "date-fns";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../../config/pg/pgPool";
import { PgConventionDraftRepository } from "../../domains/convention/adapters/PgConventionDraftRepository";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfDaysBeforeDeletion = 30;

const deleteOldConventionDrafts = async (): Promise<{
  numberOfConventionDraftsDeleted: number;
}> => {
  const pool = createMakeScriptPgPool(config)();
  const transaction = makeKyselyDb(pool);
  const pgConventionDraftRepository = new PgConventionDraftRepository(
    transaction,
  );
  const deleteAllConventionDraftsAfter = subDays(
    new Date(),
    numberOfDaysBeforeDeletion,
  );

  const deletedOldConventionDraftIds = await pgConventionDraftRepository.delete(
    {
      endedSince: deleteAllConventionDraftsAfter,
    },
  );

  return {
    numberOfConventionDraftsDeleted: deletedOldConventionDraftIds.length,
  };
};

export const triggerDeleteOldConventionDrafts = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldConventionDrafts",
    config,
    script: monitoredAsUseCase({
      name: "DeleteOldConventionDrafts",
      cb: deleteOldConventionDrafts,
    }),
    handleResults: ({ numberOfConventionDraftsDeleted }) =>
      `${numberOfConventionDraftsDeleted} convention drafts were deleted, because they were more than ${numberOfDaysBeforeDeletion} days old`,
    logger,
    exitOnFinish,
  });

import { subMonths } from "date-fns";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../../config/pg/pgPool";
import { PgOngoingOAuthRepository } from "../../domains/core/authentication/connected-user/adapters/PgOngoingOAuthRepository";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfMonthBeforeDeletion = 6;

const deleteOldUsersOngoingOauths = async () => {
  const pool = createMakeScriptPgPool(config)();
  const transaction = makeKyselyDb(pool);
  const pgUsersOngoingOAuthRepository = new PgOngoingOAuthRepository(
    transaction,
  );
  const deleteAllUsersOngoingOauthsBefore = subMonths(
    new Date(),
    numberOfMonthBeforeDeletion,
  );
  const numberOfOngoingOauthsDeleted =
    await pgUsersOngoingOAuthRepository.deleteOldOngoingOauths(
      deleteAllUsersOngoingOauthsBefore,
    );
  return { numberOfOngoingOauthsDeleted };
};

export const triggerDeleteOldUsersOngoingOauths = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldUsersOngoingOauths",
    config,
    script: monitoredAsUseCase({
      name: "DeleteOldUsersOngoingOauths",
      cb: deleteOldUsersOngoingOauths,
    }),
    handleResults: ({ numberOfOngoingOauthsDeleted }) =>
      `${numberOfOngoingOauthsDeleted} ongoing oauths deleted, because they were more than ${numberOfMonthBeforeDeletion} months old`,
    logger,
    exitOnFinish,
  });

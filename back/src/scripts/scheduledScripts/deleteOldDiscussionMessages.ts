import { subMonths } from "date-fns";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../../config/pg/pgPool";
import { PgDiscussionRepository } from "../../domains/establishment/adapters/PgDiscussionRepository";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfMonthBeforeDeletion = 6;

const deleteOldDiscussionMessages = async () => {
  const pool = createMakeScriptPgPool(config)();
  const transaction = makeKyselyDb(pool);
  const pgDiscussionRepository = new PgDiscussionRepository(transaction);
  const deleteAllDiscussionMessagesBefore = subMonths(
    new Date(),
    numberOfMonthBeforeDeletion,
  );
  const numberOfMessagesDeleted =
    await pgDiscussionRepository.deleteOldMessages(
      deleteAllDiscussionMessagesBefore,
    );
  return { numberOfMessagesDeleted };
};

export const triggerDeleteOldDiscussionMessages = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldDiscussionMessages",
    config,
    script: deleteOldDiscussionMessages,
    handleResults: ({ numberOfMessagesDeleted }) =>
      `${numberOfMessagesDeleted} messages in discussion were deleted, because they were more than ${numberOfMonthBeforeDeletion} months old`,
    logger,
    exitOnFinish,
  });

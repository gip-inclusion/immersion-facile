import { subMonths } from "date-fns";
import { Pool } from "pg";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { PgDiscussionAggregateRepository } from "../domains/establishment/adapters/PgDiscussionAggregateRepository";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfMonthBeforeDeletion = 6;

const triggerDeleteOldDiscussionMessages = async () => {
  const dbUrl = config.pgImmersionDbUrl;

  const pool = new Pool({
    connectionString: dbUrl,
  });

  const transaction = makeKyselyDb(pool);
  const pgDiscussionAggregateRepository = new PgDiscussionAggregateRepository(
    transaction,
  );
  const deleteAllDiscussionMessagesBefore = subMonths(
    new Date(),
    numberOfMonthBeforeDeletion,
  );
  const numberOfMessagesDeleted =
    await pgDiscussionAggregateRepository.deleteOldMessages(
      deleteAllDiscussionMessagesBefore,
    );
  return { numberOfMessagesDeleted };
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "triggerDeleteOldDiscussionMessages",
  config,
  triggerDeleteOldDiscussionMessages,
  ({ numberOfMessagesDeleted }) =>
    `${numberOfMessagesDeleted} messages in discussion were deleted, because they were more than ${numberOfMonthBeforeDeletion} months old`,
  logger,
);

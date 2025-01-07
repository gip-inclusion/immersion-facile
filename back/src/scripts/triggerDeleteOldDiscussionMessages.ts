import { subMonths } from "date-fns";
import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { PgDiscussionRepository } from "../domains/establishment/adapters/PgDiscussionRepository";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();
const numberOfMonthBeforeDeletion = 6;

const triggerDeleteOldDiscussionMessages = async () => {
  const dbUrl = config.pgImmersionDbUrl;

  const pool = new Pool({
    connectionString: dbUrl,
  });

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

handleCRONScript(
  "triggerDeleteOldDiscussionMessages",
  config,
  triggerDeleteOldDiscussionMessages,
  ({ numberOfMessagesDeleted }) =>
    `${numberOfMessagesDeleted} messages in discussion were deleted, because they were more than ${numberOfMonthBeforeDeletion} months old`,
  logger,
);

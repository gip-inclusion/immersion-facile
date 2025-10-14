import { createLogger } from "../utils/logger";
import { triggerDeactivateUnresponsiveEstablishments } from "./scheduledScripts/deactivateUnresponsiveEstablishments";
import { triggerDeleteOldDiscussionMessages } from "./scheduledScripts/deleteOldDiscussionMessages";
import { triggerMarkEstablishmentsAsSearchableWhenMaxContactsAllows } from "./scheduledScripts/markEstablishmentsAsSearchableWhenMaxContactsAllows copy";
import { triggerMarkObsoleteDiscussionsAsDeprecated } from "./scheduledScripts/markObsoleteDiscussionsAsDeprecated";
import { triggerMarkOldConventionAsDeprecated } from "./scheduledScripts/markOldConventionAsDeprecated";
import { triggerSuggestEditFormEstablishmentEvery6Months } from "./scheduledScripts/suggestEditFormEstablishmentEvery6Months";
import { triggerUpdateAllEstablishmentsScores } from "./scheduledScripts/updateAllEstablishmentsScores";

const logger = createLogger(__filename);

const main = async () => {
  await triggerDeactivateUnresponsiveEstablishments({ exitOnFinish: false });
  await triggerUpdateAllEstablishmentsScores({ exitOnFinish: false });
  await triggerDeleteOldDiscussionMessages({ exitOnFinish: false });
  await triggerMarkOldConventionAsDeprecated({ exitOnFinish: false });
  await triggerMarkObsoleteDiscussionsAsDeprecated({ exitOnFinish: false });
  await triggerMarkEstablishmentsAsSearchableWhenMaxContactsAllows({
    exitOnFinish: false,
  });
  await triggerSuggestEditFormEstablishmentEvery6Months({
    exitOnFinish: false,
  });
};

main()
  .then(() => {
    logger.info({ message: "Evening jobs executed successfully" });
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ message: "Evening jobs triggered failed", error });
    process.exit(1);
  });

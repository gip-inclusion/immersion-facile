import "./instrumentSentryCron";
import { notifyErrorObjectToTeam, notifyTeam } from "../utils/notifyTeam";
import { triggerDeactivateUnresponsiveEstablishments } from "./scheduledScripts/deactivateUnresponsiveEstablishments";
import { triggerDeleteEmailAttachements } from "./scheduledScripts/deleteEmailAttachements";
import { triggerDeleteOldConventionDrafts } from "./scheduledScripts/deleteOldConventionDrafts";
import { triggerDeleteOldDiscussionMessages } from "./scheduledScripts/deleteOldDiscussionMessages";
import { triggerMarkEstablishmentsAsSearchableWhenMaxContactsAllows } from "./scheduledScripts/markEstablishmentsAsSearchableWhenMaxContactsAllows";
import { triggerMarkObsoleteDiscussionsAsDeprecated } from "./scheduledScripts/markObsoleteDiscussionsAsDeprecated";
import { triggerMarkOldConventionAsDeprecated } from "./scheduledScripts/markOldConventionAsDeprecated";
import { triggerSuggestEstablishmentReengagementEvery6Months } from "./scheduledScripts/triggerSuggestEstablishmentReengagementEvery6Months";
import { triggerUpdateAllEstablishmentsScores } from "./scheduledScripts/updateAllEstablishmentsScores";

const main = async () => {
  await triggerDeleteEmailAttachements({ exitOnFinish: false });
  await triggerMarkOldConventionAsDeprecated({ exitOnFinish: false });
  await triggerDeleteOldDiscussionMessages({ exitOnFinish: false });
  await triggerUpdateAllEstablishmentsScores({ exitOnFinish: false });
  await triggerDeactivateUnresponsiveEstablishments({ exitOnFinish: false });
  await triggerMarkEstablishmentsAsSearchableWhenMaxContactsAllows({
    exitOnFinish: false,
  });
  await triggerMarkObsoleteDiscussionsAsDeprecated({ exitOnFinish: false });
  await triggerSuggestEstablishmentReengagementEvery6Months({
    exitOnFinish: false,
  });
  await triggerDeleteOldConventionDrafts({ exitOnFinish: false });
};

main()
  .then(async () => {
    await notifyTeam({
      rawContent: "Evening jobs executed successfully",
      isError: false,
    });
    process.exit(0);
  })
  .catch(async (error) => {
    await notifyTeam({
      rawContent: "Evening jobs triggered failed",
      isError: true,
    });
    await notifyErrorObjectToTeam(error);
    process.exit(1);
  });

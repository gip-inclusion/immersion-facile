import "./instrumentSentryCron";
import { triggerDeleteOldDiscussionMessages } from "./scheduledScripts/deleteOldDiscussionMessages";

triggerDeleteOldDiscussionMessages({ exitOnFinish: true });

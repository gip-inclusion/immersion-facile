import "./instrumentSentryCron";
import { triggerDeleteOldUsersOngoingOauths } from "./scheduledScripts/deleteOldUsersOngoingOauths";

triggerDeleteOldUsersOngoingOauths({ exitOnFinish: true });

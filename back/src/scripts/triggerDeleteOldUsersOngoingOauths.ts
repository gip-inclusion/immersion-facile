import { triggerDeleteOldUsersOngoingOauths } from "./scheduledScripts/deleteOldUsersOngoingOauths";

triggerDeleteOldUsersOngoingOauths({ exitOnFinish: true });

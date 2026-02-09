import { triggerDeleteInactiveUsers } from "./scheduledScripts/deleteInactiveUsers";

triggerDeleteInactiveUsers({ exitOnFinish: true });

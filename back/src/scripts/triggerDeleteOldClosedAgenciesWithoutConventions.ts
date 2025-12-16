import { triggerDeleteOldClosedAgenciesWithoutConventions } from "./scheduledScripts/deleteOldClosedAgenciesWithoutConventions";

triggerDeleteOldClosedAgenciesWithoutConventions({ exitOnFinish: true });

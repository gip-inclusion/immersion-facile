import "./instrumentSentryCron";
import { triggerCloseInactiveAgenciesWithoutRecentConventions } from "./scheduledScripts/closeInactiveAgenciesWithoutRecentConventions";

triggerCloseInactiveAgenciesWithoutRecentConventions({ exitOnFinish: true });

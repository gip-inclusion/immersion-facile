import "./instrumentSentryCron";
import { triggerDeleteOldConventions } from "./scheduledScripts/deleteOldConventions";

triggerDeleteOldConventions({ exitOnFinish: true });

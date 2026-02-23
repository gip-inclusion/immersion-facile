import "./instrumentSentryCron";
import { triggerConventionReminder } from "./scheduledScripts/conventionReminder";

triggerConventionReminder({ exitOnFinish: true });

import "./instrumentSentryCron";
import { triggerDelegationConventionReminder } from "./scheduledScripts/delegationConventionReminder";

triggerDelegationConventionReminder({ exitOnFinish: true });

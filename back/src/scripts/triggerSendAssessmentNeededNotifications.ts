import "./instrumentSentryCron";
import { triggerSendAssessmentNeededNotifications } from "./scheduledScripts/sendAssessmentNeededNotifications";

triggerSendAssessmentNeededNotifications({ exitOnFinish: true });

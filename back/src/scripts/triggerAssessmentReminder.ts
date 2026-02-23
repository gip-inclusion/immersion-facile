import "./instrumentSentryCron";
import { triggerAssessmentReminder } from "./scheduledScripts/assessmentReminder";

triggerAssessmentReminder({ exitOnFinish: true });

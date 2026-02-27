import "./instrumentSentryCron";
import { triggerSuggestEstablishmentReengagementEvery6Months } from "./scheduledScripts/triggerSuggestEstablishmentReengagementEvery6Months";

triggerSuggestEstablishmentReengagementEvery6Months({ exitOnFinish: true });

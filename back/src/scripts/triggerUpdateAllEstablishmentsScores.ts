import "./instrumentSentryCron";
import { triggerUpdateAllEstablishmentsScores } from "./scheduledScripts/updateAllEstablishmentsScores";

triggerUpdateAllEstablishmentsScores({ exitOnFinish: true });

import "./instrumentSentryCron";
import { triggerUpdateEstablishmentsFromSireneApiScript } from "./scheduledScripts/updateEstablishmentsFromSireneApiScript";

triggerUpdateEstablishmentsFromSireneApiScript({ exitOnFinish: true });

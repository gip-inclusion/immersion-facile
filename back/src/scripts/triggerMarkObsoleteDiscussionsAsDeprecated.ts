import "./instrumentSentryCron";
import { triggerMarkObsoleteDiscussionsAsDeprecated } from "./scheduledScripts/markObsoleteDiscussionsAsDeprecated";

triggerMarkObsoleteDiscussionsAsDeprecated({ exitOnFinish: true });

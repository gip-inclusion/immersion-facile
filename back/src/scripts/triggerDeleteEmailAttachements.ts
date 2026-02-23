import "./instrumentSentryCron";
import { triggerDeleteEmailAttachements } from "./scheduledScripts/deleteEmailAttachements";

triggerDeleteEmailAttachements({ exitOnFinish: true });

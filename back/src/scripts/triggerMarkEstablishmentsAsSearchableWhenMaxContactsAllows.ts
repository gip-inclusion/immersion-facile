import "./instrumentSentryCron";
import { triggerMarkEstablishmentsAsSearchableWhenMaxContactsAllows } from "./scheduledScripts/markEstablishmentsAsSearchableWhenMaxContactsAllows";

triggerMarkEstablishmentsAsSearchableWhenMaxContactsAllows({
  exitOnFinish: true,
});

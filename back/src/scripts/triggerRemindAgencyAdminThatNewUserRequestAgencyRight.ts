import "./instrumentSentryCron";
import { triggerRemindAgencyAdminThatNewUserRequestAgencyRight } from "./scheduledScripts/remindAgencyAdminThatNewUserRequestAgencyRight";

triggerRemindAgencyAdminThatNewUserRequestAgencyRight({ exitOnFinish: true });

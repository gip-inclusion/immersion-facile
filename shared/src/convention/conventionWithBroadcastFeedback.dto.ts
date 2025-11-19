import type { ConventionLastBroadcastFeedbackResponse } from "../broadcast/broadcastFeedback.dto";
import type { ConventionId } from "./convention.dto";
import type { WithFirstnameAndLastname } from "./convention.schema";

export type ConventionWithBroadcastFeedback = {
  id: ConventionId;
  beneficiary: WithFirstnameAndLastname;
  lastBroadcastFeedback: ConventionLastBroadcastFeedbackResponse;
};

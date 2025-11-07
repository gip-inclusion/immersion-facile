import type {
  ApiConsumerId,
  ApiConsumerName,
  ConventionId,
  ConventionStatus,
  DateString,
} from "..";
import type { AbsoluteUrl } from "../AbsoluteUrl";

export type ConventionBroadcastRequestParams = {
  conventionId: ConventionId;
  callbackUrl?: AbsoluteUrl;
  conventionStatus?: ConventionStatus;
};
export type BroadcastFeedbackResponse = {
  httpStatus: number;
  body?: unknown;
} | null;

export type SubscriberErrorFeedback = {
  message: string;
  error?: unknown;
};

export type BroadcastFeedback = {
  serviceName: string;
  consumerId: ApiConsumerId | null;
  consumerName: ApiConsumerName;
  subscriberErrorFeedback?: SubscriberErrorFeedback;
  requestParams: ConventionBroadcastRequestParams;
  response?: BroadcastFeedbackResponse;
  occurredAt: DateString;
  handledByAgency: boolean;
};

export type ConventionLastBroadcastFeedbackResponse = BroadcastFeedback | null;

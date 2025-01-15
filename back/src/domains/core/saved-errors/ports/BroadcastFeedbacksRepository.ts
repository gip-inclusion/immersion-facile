import {
  AbsoluteUrl,
  ApiConsumerId,
  ApiConsumerName,
  ConventionId,
  ConventionStatus,
} from "shared";
import { SubscriberErrorFeedback } from "../../api-consumer/ports/SubscribersGateway";

export type ConventionBroadcastRequestParams = {
  conventionId: ConventionId;
  callbackUrl?: AbsoluteUrl;
  conventionStatus?: ConventionStatus;
};
export type BroadcastFeedbackResponse = {
  httpStatus: number;
  body?: unknown;
} | null;

export type BroadcastFeedback = {
  serviceName: string;
  consumerId: ApiConsumerId | null;
  consumerName: ApiConsumerName;
  subscriberErrorFeedback?: SubscriberErrorFeedback;
  requestParams: ConventionBroadcastRequestParams;
  response?: BroadcastFeedbackResponse;
  occurredAt: Date;
  handledByAgency: boolean;
};

export const broadcastToPartnersServiceName =
  "BroadcastToPartnersOnConventionUpdates";

export const broadcastToFtServiceName =
  "FranceTravailGateway.notifyOnConventionUpdated";

export interface BroadcastFeedbacksRepository {
  save: (broadcastFeedback: BroadcastFeedback) => Promise<void>;
  markPartnersErroredConventionAsHandled: (id: ConventionId) => Promise<void>;
  getLastBroadcastFeedback: (
    id: ConventionId,
  ) => Promise<BroadcastFeedback | null>;
}

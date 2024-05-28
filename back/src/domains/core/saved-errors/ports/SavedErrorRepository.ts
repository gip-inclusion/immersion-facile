import { ApiConsumerId, ApiConsumerName, ConventionId } from "shared";
import { SubscriberErrorFeedback } from "../../api-consumer/ports/SubscribersGateway";

export type SavedError = {
  serviceName: string;
  consumerId: ApiConsumerId | null;
  consumerName: ApiConsumerName;
  subscriberErrorFeedback: SubscriberErrorFeedback;
  params?: Record<string, unknown>;
  occurredAt: Date;
  handledByAgency: boolean;
};
export const broadcastToPeServiceName =
  "PoleEmploiGateway.notifyOnConventionUpdated";

export interface SavedErrorRepository {
  save: (savedError: SavedError) => Promise<void>;
  markPartnersErroredConventionAsHandled: (id: ConventionId) => Promise<void>;
}

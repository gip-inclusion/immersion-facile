import { ApiConsumerId, ApiConsumerName, ConventionId } from "shared";
import { Feedback } from "../../api-consumer/ports/SubscribersGateway";

export type SavedError = {
  serviceName: string;
  consumerId: ApiConsumerId | null;
  consumerName: ApiConsumerName;
  feedback: Feedback;
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

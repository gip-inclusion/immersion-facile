import { ApiConsumerId, ApiConsumerName, ConventionId } from "shared";

export type SavedError = {
  serviceName: string;
  consumerId: ApiConsumerId | null;
  consumerName: ApiConsumerName;
  message: string;
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

import { ConventionId } from "shared";

export type SavedError = {
  serviceName: string;
  message: string;
  params: Record<string, unknown>;
  occurredAt: Date;
  handledByAgency: boolean;
};
export const broadcastToPeServiceName =
  "PoleEmploiGateway.notifyOnConventionUpdated";
export interface ErrorRepository {
  save: (savedError: SavedError) => Promise<void>;
  markPartnersErroredConventionAsHandled: (id: ConventionId) => Promise<void>;
}

import type { ArchivedConventionRequestId } from "shared";
import type { ArchivedConventionRequestEntity } from "../entities/ArchivedConventionRequestEntity";

export interface ArchivedConventionRequestRepository {
  save: (
    archivedConventionRequest: ArchivedConventionRequestEntity,
  ) => Promise<void>;
  getById: (
    id: ArchivedConventionRequestId,
  ) => Promise<ArchivedConventionRequestEntity | undefined>;
}

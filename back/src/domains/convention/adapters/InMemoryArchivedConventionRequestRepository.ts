import type { ArchivedConventionRequestId } from "shared";
import type {
  ArchivedConventionRequestEntity,
  ArchivedConventionRequestRepository,
} from "../ports/ArchivedConventionRequestRepository";

export class InMemoryArchivedConventionRequestRepository
  implements ArchivedConventionRequestRepository
{
  public archivedConventionRequests: Record<
    ArchivedConventionRequestId,
    ArchivedConventionRequestEntity
  > = {};

  public async getById(
    id: ArchivedConventionRequestId,
  ): Promise<ArchivedConventionRequestEntity | undefined> {
    return this.archivedConventionRequests[id];
  }

  public async save(
    archivedConventionRequest: ArchivedConventionRequestEntity,
  ): Promise<void> {
    this.archivedConventionRequests[archivedConventionRequest.id] =
      archivedConventionRequest;
  }
}

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

  public async getAll(): Promise<ArchivedConventionRequestEntity[]> {
    return Object.values(this.archivedConventionRequests).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  public async save(
    archivedConventionRequest: ArchivedConventionRequestEntity,
  ): Promise<void> {
    this.archivedConventionRequests[archivedConventionRequest.id] =
      archivedConventionRequest;
  }
}

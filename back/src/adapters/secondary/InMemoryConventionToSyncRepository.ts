import { ConventionId } from "shared";
import {
  ConventionToSync,
  ConventionToSyncRepository,
} from "../../domain/convention/ports/ConventionToSyncRepository";

export class InMemoryConventionToSyncRepository
  implements ConventionToSyncRepository
{
  public async getById(
    id: ConventionId,
  ): Promise<ConventionToSync | undefined> {
    return this.conventionsToSync.find((convention) => convention.id === id);
  }

  public async getNotProcessedAndErrored(
    limit: number,
  ): Promise<ConventionToSync[]> {
    return this.conventionsToSync
      .filter(({ status }) => status === "ERROR" || status === "TO_PROCESS")
      .slice(0, limit);
  }

  public async save(conventionToSync: ConventionToSync): Promise<void> {
    const index = this.conventionsToSync.findIndex(
      (convention) => convention.id === conventionToSync.id,
    );
    index === -1
      ? this.conventionsToSync.push(conventionToSync)
      : (this.conventionsToSync[index] = conventionToSync);
  }

  // for testing purpose
  public setForTesting(conventions: ConventionToSync[]) {
    this.conventionsToSync = conventions;
  }

  public conventionsToSync: ConventionToSync[] = [];
}

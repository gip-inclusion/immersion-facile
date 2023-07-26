import { ConventionId } from "shared";
import {
  ConventionsToSyncRepository,
  ConventionToSync,
} from "../../domain/convention/ports/ConventionsToSyncRepository";

export class InMemoryConventionsToSyncRepository
  implements ConventionsToSyncRepository
{
  public conventionsToSync: ConventionToSync[] = [];

  public async getById(
    id: ConventionId,
  ): Promise<ConventionToSync | undefined> {
    return this.conventionsToSync.find((convention) => convention.id === id);
  }

  public async getToProcessOrError(limit: number): Promise<ConventionToSync[]> {
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
}

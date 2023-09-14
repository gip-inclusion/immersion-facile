import { ConventionExternalId, ConventionId } from "shared";
import { ConventionExternalIdRepository } from "../../domain/convention/ports/ConventionExternalIdRepository";

export class InMemoryConventionExternalIdRepository
  implements ConventionExternalIdRepository
{
  #externalIdsByConventionId: Record<ConventionId, ConventionExternalId> = {};

  #nextExternalId: ConventionExternalId = "next-external-id-not-provided";

  public set externalIdsByConventionId(
    externalIdsByConventionId: Record<ConventionId, ConventionExternalId>,
  ) {
    this.#externalIdsByConventionId = externalIdsByConventionId;
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionExternalId | undefined> {
    return this.#externalIdsByConventionId[conventionId];
  }

  public set nextExternalId(nextExternalId: ConventionExternalId) {
    this.#nextExternalId = nextExternalId;
  }

  public async save(conventionId: ConventionId): Promise<void> {
    this.#externalIdsByConventionId[conventionId] = this.#nextExternalId;
  }
}

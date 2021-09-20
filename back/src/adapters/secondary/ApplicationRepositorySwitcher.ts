import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import {
  ApplicationSource,
  DemandeImmersionId,
} from "../../shared/DemandeImmersionDto";
import { FeatureDisabledError } from "../../shared/featureFlags";

export type ApplicationRepositoryMap = Partial<
  Record<ApplicationSource, DemandeImmersionRepository>
>;
export class ApplicationRepositorySwitcher
  implements DemandeImmersionRepository
{
  private readonly applicationRepositories: DemandeImmersionRepository[];

  constructor(readonly applicationRepositoryMap: ApplicationRepositoryMap) {
    this.applicationRepositories = Object.values(applicationRepositoryMap);
  }

  public async save(
    entity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    return await this.getRepositoryBySource(entity.source).save(entity);
  }

  public async getById(
    id: DemandeImmersionId
  ): Promise<DemandeImmersionEntity | undefined> {
    const entities = await this.demux((repository) => repository.getById(id));
    if (entities.length == 0) return undefined;
    if (entities.length > 1)
      throw new Error(`More results than expected: ${id}`);
    return entities[0];
  }

  public async getAll(): Promise<DemandeImmersionEntity[]> {
    const entityLists = await this.demux((repository) => repository.getAll());
    return entityLists.reduce(
      (response, entityList) => response.concat(entityList),
      []
    );
  }

  public async updateDemandeImmersion(
    entity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    return this.getRepositoryBySource(entity.source).updateDemandeImmersion(
      entity
    );
  }

  private async demux<Type>(
    fn: (repo: DemandeImmersionRepository) => Promise<Type>
  ): Promise<Type[]> {
    if (this.applicationRepositories.length == 0)
      throw new FeatureDisabledError();
    const responses = await Promise.all(this.applicationRepositories.map(fn));
    return responses.filter((response) => response !== undefined);
  }

  private getRepositoryBySource(
    source: ApplicationSource
  ): DemandeImmersionRepository {
    const repository = this.applicationRepositoryMap[source];
    if (!repository) throw new FeatureDisabledError(source);
    return repository;
  }
}

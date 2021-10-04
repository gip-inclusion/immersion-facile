import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import {
  ApplicationSource,
  ImmersionApplicationId,
} from "../../shared/ImmersionApplicationDto";
import { FeatureDisabledError } from "../../shared/featureFlags";

export type ApplicationRepositoryMap = Partial<
  Record<ApplicationSource, ImmersionApplicationRepository>
>;
export class ApplicationRepositorySwitcher
  implements ImmersionApplicationRepository
{
  private readonly applicationRepositories: ImmersionApplicationRepository[];

  constructor(readonly applicationRepositoryMap: ApplicationRepositoryMap) {
    this.applicationRepositories = Object.values(applicationRepositoryMap);
  }

  public async save(
    entity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    return await this.getRepositoryBySource(entity.source).save(entity);
  }

  public async getById(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationEntity | undefined> {
    const entities = await this.demux((repository) => repository.getById(id));
    if (entities.length == 0) return undefined;
    if (entities.length > 1)
      throw new Error(`More results than expected: ${id}`);
    return entities[0];
  }

  public async getAll(): Promise<ImmersionApplicationEntity[]> {
    const entityLists = await this.demux((repository) => repository.getAll());
    return entityLists.reduce(
      (response, entityList) => response.concat(entityList),
      [],
    );
  }

  public async updateImmersionApplication(
    entity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    return this.getRepositoryBySource(entity.source).updateImmersionApplication(
      entity,
    );
  }

  private async demux<Type>(
    fn: (repo: ImmersionApplicationRepository) => Promise<Type>,
  ): Promise<Type[]> {
    if (this.applicationRepositories.length == 0)
      throw new FeatureDisabledError();
    const responses = await Promise.all(this.applicationRepositories.map(fn));
    return responses.filter((response) => response !== undefined);
  }

  private getRepositoryBySource(
    source: ApplicationSource,
  ): ImmersionApplicationRepository {
    const repository = this.applicationRepositoryMap[source];
    if (!repository) throw new FeatureDisabledError(source);
    return repository;
  }
}

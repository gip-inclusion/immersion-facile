import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export type ImmersionApplications = {
  [id: string]: ImmersionApplicationEntity;
};

export class InMemoryImmersionApplicationRepository
  implements ImmersionApplicationRepository
{
  private _immersionApplications: ImmersionApplications = {};

  public async save(
    demandeImmersionEntity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    logger.info({ demandeImmersionEntity }, "save");
    if (this._immersionApplications[demandeImmersionEntity.id]) {
      return undefined;
    }
    this._immersionApplications[demandeImmersionEntity.id] =
      demandeImmersionEntity;
    return demandeImmersionEntity.id;
  }

  public async getAll() {
    logger.info("getAll");
    return Object.values(this._immersionApplications);
  }

  public async getById(id: ImmersionApplicationId) {
    logger.info({ id }, "getById");
    return this._immersionApplications[id];
  }

  public async updateImmersionApplication(
    immersionApplication: ImmersionApplicationEntity,
  ) {
    logger.info({ immersionApplication }, "updateDemandeImmersion");
    const id = immersionApplication.id;
    if (!this._immersionApplications[id]) {
      return undefined;
    }
    this._immersionApplications[id] = immersionApplication;
    return id;
  }

  // Visible for testing.
  // TODO: Rename to setImmersionApplication.
  setDemandesImmersion(demandesImmersion: ImmersionApplications) {
    this._immersionApplications = demandesImmersion;
  }
}

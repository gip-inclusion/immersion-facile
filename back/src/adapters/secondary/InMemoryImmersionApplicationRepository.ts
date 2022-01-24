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
    immersionApplicationEntity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    logger.info({ immersionApplicationEntity }, "save");
    if (this._immersionApplications[immersionApplicationEntity.id]) {
      return undefined;
    }
    this._immersionApplications[immersionApplicationEntity.id] =
      immersionApplicationEntity;
    return immersionApplicationEntity.id;
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
    logger.info({ immersionApplication }, "updateImmersionApplication");
    const id = immersionApplication.id;
    if (!this._immersionApplications[id]) {
      return undefined;
    }
    this._immersionApplications[id] = immersionApplication;
    return id;
  }

  // Visible for testing.
  // TODO: Rename to setImmersionApplication.
  setImmersionApplications(immersionApplications: ImmersionApplications) {
    this._immersionApplications = immersionApplications;
  }
}

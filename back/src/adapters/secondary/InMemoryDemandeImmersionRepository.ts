import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionId } from "../../shared/DemandeImmersionDto";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export type DemandesImmersion = {
  [id: string]: DemandeImmersionEntity;
};

export class InMemoryDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private _demandesImmersion: DemandesImmersion = {};

  public async save(
    demandeImmersionEntity: DemandeImmersionEntity,
  ): Promise<DemandeImmersionId | undefined> {
    logger.info({ demandeImmersionEntity }, "save");
    if (this._demandesImmersion[demandeImmersionEntity.id]) {
      return undefined;
    }
    this._demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
    return demandeImmersionEntity.id;
  }

  public async getAll() {
    logger.info("getAll");
    return Object.values(this._demandesImmersion);
  }

  public async getById(id: DemandeImmersionId) {
    logger.info({ id }, "getById");
    return this._demandesImmersion[id];
  }

  public async updateDemandeImmersion(
    demandeImmersion: DemandeImmersionEntity,
  ) {
    logger.info({ demandeImmersion }, "updateDemandeImmersion");
    const id = demandeImmersion.id;
    if (!this._demandesImmersion[id]) {
      return undefined;
    }
    this._demandesImmersion[id] = demandeImmersion;
    return id;
  }

  setDemandesImmersion(demandesImmersion: DemandesImmersion) {
    this._demandesImmersion = demandesImmersion;
  }
}

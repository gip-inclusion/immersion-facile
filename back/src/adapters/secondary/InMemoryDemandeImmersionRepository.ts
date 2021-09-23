import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionId } from "../../shared/DemandeImmersionDto";
import { logger } from "../../utils/logger";

export type DemandesImmersion = {
  [id: string]: DemandeImmersionEntity;
};

export class InMemoryDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private readonly logger = logger.child({
    logsource: "InMemoryDemandeImmersionRepository",
  });
  private _demandesImmersion: DemandesImmersion = {};

  public async save(
    demandeImmersionEntity: DemandeImmersionEntity,
  ): Promise<DemandeImmersionId | undefined> {
    this.logger.info({ demandeImmersionEntity }, "save");
    if (this._demandesImmersion[demandeImmersionEntity.id]) {
      return undefined;
    }
    this._demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
    return demandeImmersionEntity.id;
  }

  public async getAll() {
    this.logger.info("getAll");
    return Object.values(this._demandesImmersion);
  }

  public async getById(id: DemandeImmersionId) {
    this.logger.info({ id }, "getById");
    return this._demandesImmersion[id];
  }

  public async updateDemandeImmersion(
    demandeImmersion: DemandeImmersionEntity,
  ) {
    this.logger.info({ demandeImmersion }, "updateDemandeImmersion");
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

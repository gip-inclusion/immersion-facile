import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionId } from "../../shared/DemandeImmersionDto";

export type DemandesImmersion = {
  [id: string]: DemandeImmersionEntity;
};

export class InMemoryDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private _demandesImmersion: DemandesImmersion = {};

  public async save(
    demandeImmersionEntity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    if (this._demandesImmersion[demandeImmersionEntity.id]) {
      return undefined;
    }
    this._demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
    return demandeImmersionEntity.id;
  }

  public async getAll() {
    return Object.values(this._demandesImmersion);
  }

  public async getById(id: DemandeImmersionId) {
    return this._demandesImmersion[id];
  }

  public async updateDemandeImmersion(
    demandeImmersion: DemandeImmersionEntity
  ) {
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

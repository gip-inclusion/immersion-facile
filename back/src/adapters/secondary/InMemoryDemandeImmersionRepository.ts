import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { v4 as uuidV4 } from "uuid";
import { DemandeImmersionId } from "../../shared/DemandeImmersionDto";

export interface InMemoryDemandeImmersionIdGenerator {
  nextId: () => string;
}

class DefaultIdGenerator implements InMemoryDemandeImmersionIdGenerator {
  public nextId() {
    return uuidV4();
  }
}

export class FakeIdGenerator implements InMemoryDemandeImmersionIdGenerator {
  public id = "fake_demande_immersion_id";

  public nextId(): string {
    return this.id;
  }
}

export type DemandesImmersion = {
  [id: string]: DemandeImmersionEntity;
};

export class InMemoryDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private readonly idGenerator: InMemoryDemandeImmersionIdGenerator;
  private _demandesImmersion: DemandesImmersion = {};

  public constructor(
    idGenerator: InMemoryDemandeImmersionIdGenerator = new DefaultIdGenerator()
  ) {
    this.idGenerator = idGenerator;
  }

  public async save(
    demandeImmersionEntity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId> {
    this._demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
    return demandeImmersionEntity.id;
  }

  public async getAll() {
    const demandesImmersion = [];
    for (let id in this._demandesImmersion) {
      demandesImmersion.push(this._demandesImmersion[id]);
    }
    return demandesImmersion;
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

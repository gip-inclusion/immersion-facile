import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionIdEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionIdEntity";
import { v4 as uuidV4 } from "uuid";

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
  ): Promise<DemandeImmersionIdEntity> {
    const id = this.idGenerator.nextId();
    this._demandesImmersion[id] = demandeImmersionEntity;
    return DemandeImmersionIdEntity.create(id);
  }

  public async getAll() {
    const demandesImmersion = [];
    for (let id in this._demandesImmersion) {
      demandesImmersion.push(this._demandesImmersion[id]);
    }
    return demandesImmersion;
  }

  public async getById(id: DemandeImmersionIdEntity) {
    return this._demandesImmersion[id.id];
  }

  public async updateDemandeImmersion(
    id: DemandeImmersionIdEntity,
    demandeImmersion: DemandeImmersionEntity
  ) {
    if (!this._demandesImmersion[id.id]) {
      return undefined;
    }
    this._demandesImmersion[id.id] = demandeImmersion;
    return id;
  }

  setDemandesImmersion(demandesImmersion: DemandesImmersion) {
    this._demandesImmersion = demandesImmersion;
  }
}

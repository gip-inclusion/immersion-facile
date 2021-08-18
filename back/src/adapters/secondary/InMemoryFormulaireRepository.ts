import { FormulaireRepository } from "../../domain/formulaires/ports/FormulaireRepository";
import { FormulaireEntity } from "../../domain/formulaires/entities/FormulaireEntity";
import { FormulaireIdEntity } from "../../domain/formulaires/entities/FormulaireIdEntity";
import { v4 as uuidV4 } from "uuid";

export interface InMemoryFormulaireIdGenerator {
  nextId: () => string;
}

class DefaultIdGenerator implements InMemoryFormulaireIdGenerator {
  public nextId() {
    return uuidV4();
  }
}

export class FakeIdGenerator implements InMemoryFormulaireIdGenerator {
  public id = "fake_formulaire_id";

  public nextId(): string {
    return this.id;
  }
}

export class InMemoryFormulaireRepository implements FormulaireRepository {
  private readonly idGenerator: InMemoryFormulaireIdGenerator;
  private _formulaires: FormulaireEntity[] = [];

  public constructor(
    idGenerator: InMemoryFormulaireIdGenerator = new DefaultIdGenerator()
  ) {
    this.idGenerator = idGenerator;
  }

  public async save(
    formulaireEntity: FormulaireEntity
  ): Promise<FormulaireIdEntity> {
    this._formulaires.push(formulaireEntity);
    return FormulaireIdEntity.create(this.idGenerator.nextId());
  }

  public async getAllFormulaires() {
    return this._formulaires;
  }

  setFormulaires(formulaireEntites: FormulaireEntity[]) {
    this._formulaires = formulaireEntites;
  }
}

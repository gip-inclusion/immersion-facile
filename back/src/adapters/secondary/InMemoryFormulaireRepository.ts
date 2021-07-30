import { FormulaireRepository } from "../../domain/formulaires/ports/FormulaireRepository";
import { FormulaireEntity } from "../../domain/formulaires/entities/FormulaireEntity";

export class InMemoryFormulaireRepository implements FormulaireRepository {
  private _formulaires: FormulaireEntity[] = [];

  public async save(formulaireEntity: FormulaireEntity) {
    this._formulaires.push(formulaireEntity);
  }
  
  public async getAllFormulaires() {
    return this._formulaires;
  }

  setFormulaires(formulaireEntites: FormulaireEntity[]) {
    this._formulaires = formulaireEntites;
  }
}

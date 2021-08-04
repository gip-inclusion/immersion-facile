import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import type { FormulaireDto } from "src/shared/FormulaireDto";

export class InMemoryFormulaireGateway implements FormulaireGateway {
  constructor(private _formulaires: FormulaireDto[] = []) { }

  public async add(formulaire: FormulaireDto): Promise<void> {
    console.log(formulaire)
    this._formulaires.push(formulaire);
  }

  // for test purpose:
  public getFormulaires() {
    return this._formulaires;
  }
}

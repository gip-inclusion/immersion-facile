import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import type { FormulaireDto, AddFormulaireResponseDto } from "src/shared/FormulaireDto";

export class InMemoryFormulaireGateway implements FormulaireGateway {
  constructor(private _formulaires: FormulaireDto[] = []) { }

  public async add(formulaire: FormulaireDto): Promise<AddFormulaireResponseDto> {
    console.log(formulaire)
    this._formulaires.push(formulaire);
    return {id: 'fake-test-id'};
  }

  // for test purpose:
  public getFormulaires() {
    return this._formulaires;
  }
}

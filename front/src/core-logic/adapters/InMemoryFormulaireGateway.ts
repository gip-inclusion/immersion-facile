import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import type { FormulaireDto, AddFormulaireResponseDto, UpdateFormulaireResponseDto } from "src/shared/FormulaireDto";

const FORMULAIRE_ID = "fake-test-id";
export class InMemoryFormulaireGateway implements FormulaireGateway {
  constructor(private _formulaires: FormulaireDto[] = []) { }

  public async add(formulaire: FormulaireDto): Promise<string> {
    console.log("InMemoryFormulaireGateway.add: ", formulaire);
    this._formulaires.push(formulaire);
    return FORMULAIRE_ID;
  }

  public async get(id: string): Promise<FormulaireDto> {
    console.log("InMemoryFormulaireGateway.get: ", id);
    return this._formulaires[0];
  }

  public async update(id: string, formulaire: FormulaireDto): Promise<string> {
    console.log("InMemoryFormulaireGateway.update: ", formulaire);
    this._formulaires[0] = formulaire;
    return FORMULAIRE_ID;
  }
}

import { FormulaireDto, AddFormulaireResponseDto, UpdateFormulaireResponseDto } from "src/shared/FormulaireDto";

export interface FormulaireGateway {
  add: (formulaire: FormulaireDto) => Promise<string>;
  get: (id: string) => Promise<FormulaireDto>;
  update: (id: string, formulaire: FormulaireDto) => Promise<string>;
}

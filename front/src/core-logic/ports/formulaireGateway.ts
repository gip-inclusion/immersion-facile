import { FormulaireDto } from "src/shared/FormulaireDto";

export interface FormulaireGateway {
  add: (todo: FormulaireDto) => Promise<void>;
}

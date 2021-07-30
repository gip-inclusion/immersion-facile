import { FormulaireEntity } from "../entities/FormulaireEntity";

export interface FormulaireRepository {
  save: (formulaireEntity: FormulaireEntity) => Promise<void>;
  getAllFormulaires: () => Promise<FormulaireEntity[]>;
}

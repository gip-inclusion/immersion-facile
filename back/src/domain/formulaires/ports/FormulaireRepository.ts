import { FormulaireEntity } from "../entities/FormulaireEntity";
import { FormulaireIdEntity } from "../entities/FormulaireIdEntity";

export interface FormulaireRepository {
  save: (formulaireEntity: FormulaireEntity) => Promise<FormulaireIdEntity>;
  getAllFormulaires: () => Promise<FormulaireEntity[]>;
  getFormulaire: (id: FormulaireIdEntity) => Promise<FormulaireEntity | undefined>;
}

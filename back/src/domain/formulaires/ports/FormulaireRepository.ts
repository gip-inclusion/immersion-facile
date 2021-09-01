import { FormulaireEntity } from "../entities/FormulaireEntity";
import { DemandeImmersionId } from './../../../shared/FormulaireDto';

export interface FormulaireRepository {
  save: (formulaireEntity: FormulaireEntity) => Promise<DemandeImmersionId | undefined>;
  getAllFormulaires: () => Promise<FormulaireEntity[]>;
  getFormulaire: (
    id: DemandeImmersionId
  ) => Promise<FormulaireEntity | undefined>;
  updateFormulaire: (
    formulaire: FormulaireEntity
  ) => Promise<DemandeImmersionId | undefined>;
}

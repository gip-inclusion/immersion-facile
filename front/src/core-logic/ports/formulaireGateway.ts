import { DemandeImmersionId } from './../../shared/FormulaireDto';
import { FormulaireDto, AddFormulaireResponseDto, UpdateFormulaireResponseDto } from "src/shared/FormulaireDto";

export interface FormulaireGateway {
  add: (formulaire: FormulaireDto) => Promise<DemandeImmersionId>;
  get: (id: DemandeImmersionId) => Promise<FormulaireDto>;
  update: (formulaire: FormulaireDto) => Promise<DemandeImmersionId>;

  getSiretInfo: (siret: string) => Promise<Object>;
  getAll: () => Promise<Array<FormulaireDto>>;
}

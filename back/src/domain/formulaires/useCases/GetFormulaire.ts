import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { FormulaireDto } from "../../../shared/FormulaireDto";
import { UseCase } from "../../core/UseCase";
import { formulaireEntityToDto } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";
import { DemandeImmersionId, GetFormulaireRequestDto } from './../../../shared/FormulaireDto';

type GetFormulaireDependencies = { formulaireRepository: FormulaireRepository };

export class GetFormulaire
  implements UseCase<GetFormulaireRequestDto, FormulaireDto>
{
  private readonly formulaireRepository: FormulaireRepository;

  constructor({ formulaireRepository }: GetFormulaireDependencies) {
    this.formulaireRepository = formulaireRepository;
  }

  public async execute(id: GetFormulaireRequestDto): Promise<FormulaireDto> {
    const formulaireEntity = await this.formulaireRepository.getFormulaire(id.id);
    if (!formulaireEntity) {
      throw new NotFoundError(id.id);
    }
    return formulaireEntityToDto(formulaireEntity);
  }
}

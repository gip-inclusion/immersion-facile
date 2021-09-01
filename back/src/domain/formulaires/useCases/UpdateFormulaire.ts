import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  UpdateFormulaireRequestDto,
  UpdateFormulaireResponseDto
} from "../../../shared/FormulaireDto";
import { UseCase } from "../../core/UseCase";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";

type UpdateFormulaireDependencies = {
  formulaireRepository: FormulaireRepository;
};

export class UpdateFormulaire
  implements UseCase<UpdateFormulaireRequestDto, UpdateFormulaireResponseDto>
{
  private readonly formulaireRepository: FormulaireRepository;

  constructor({ formulaireRepository }: UpdateFormulaireDependencies) {
    this.formulaireRepository = formulaireRepository;
  }

  public async execute(
    params: UpdateFormulaireRequestDto
  ): Promise<UpdateFormulaireResponseDto> {
    const formulaireEntity = FormulaireEntity.create(params.formulaire);
    const id = await this.formulaireRepository.updateFormulaire(
      formulaireEntity
    );
    if (!id) {
      throw new NotFoundError(params.formulaire.id);
    }
    return { id };
  }
}

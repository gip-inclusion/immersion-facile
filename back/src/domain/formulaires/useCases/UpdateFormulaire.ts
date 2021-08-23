import { UseCase } from "../../core/UseCase";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";
import {
  UpdateFormulaireRequestDto,
  UpdateFormulaireResponseDto,
} from "../../../shared/FormulaireDto";
import { FormulaireIdEntity } from "../entities/FormulaireIdEntity";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";

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
    const idEntity = FormulaireIdEntity.create(params.id);
    const formulaireEntity = FormulaireEntity.create(params.formulaire);
    return this.formulaireRepository
      .updateFormulaire(idEntity, formulaireEntity)
      .then((id) => {
        if (!id) {
          throw new NotFoundError(params.id);
        }
        return id;
      });
  }
}

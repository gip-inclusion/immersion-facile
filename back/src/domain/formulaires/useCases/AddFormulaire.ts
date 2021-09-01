import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddFormulaireResponseDto,
  FormulaireDto
} from "../../../shared/FormulaireDto";
import { UseCase } from "../../core/UseCase";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";

type AddFormulaireDependencies = { formulaireRepository: FormulaireRepository };

export class AddFormulaire
  implements UseCase<FormulaireDto, AddFormulaireResponseDto>
{
  private readonly formulaireRepository: FormulaireRepository;

  constructor({ formulaireRepository }: AddFormulaireDependencies) {
    this.formulaireRepository = formulaireRepository;
  }

  public async execute(
    params: FormulaireDto
  ): Promise<AddFormulaireResponseDto> {
    const formulaire = FormulaireEntity.create(params);
    const id = await this.formulaireRepository.save(formulaire);
    if (!id) {
      throw new ConflictError(formulaire.id);
    }
    return { id };
  }
}

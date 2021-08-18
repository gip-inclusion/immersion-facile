import { UseCase } from "../../core/UseCase";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";
import {
  AddFormulaireResponseDto,
  FormulaireDto,
} from "../../../shared/FormulaireDto";

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
    return this.formulaireRepository.save(formulaire);
  }
}

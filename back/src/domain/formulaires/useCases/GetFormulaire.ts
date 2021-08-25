import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { FormulaireDto } from "../../../shared/FormulaireDto";
import { UseCase } from "../../core/UseCase";
import { formulaireEntityToDto } from "../entities/FormulaireEntity";
import { FormulaireIdEntity } from "../entities/FormulaireIdEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";

type GetFormulaireDependencies = { formulaireRepository: FormulaireRepository };

export class GetFormulaire
  implements UseCase<FormulaireIdEntity, FormulaireDto>
{
  private readonly formulaireRepository: FormulaireRepository;

  constructor({ formulaireRepository }: GetFormulaireDependencies) {
    this.formulaireRepository = formulaireRepository;
  }

  public async execute(id: FormulaireIdEntity): Promise<FormulaireDto> {
    const formulaireEntity = await this.formulaireRepository.getFormulaire(id);
    if (!formulaireEntity) {
      throw new NotFoundError(id.id);
    }
    return formulaireEntityToDto(formulaireEntity);
  }
}

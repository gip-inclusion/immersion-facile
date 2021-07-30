import { FormulaireDto } from "../../../shared/FormulaireDto";
import { UseCase } from "../../core/UseCase";
import { formulaireEntityToDto } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";

type ListFormulairesDependencies = { formulaireRepository: FormulaireRepository; };

export class ListFormulaires implements UseCase<void, FormulaireDto[]> {
  private readonly formulaireRepository: FormulaireRepository;

  constructor({ formulaireRepository }: ListFormulairesDependencies) {
    this.formulaireRepository = formulaireRepository;
   }

  public async execute() {
    const entities = await this.formulaireRepository.getAllFormulaires();
    return entities.map(formulaireEntityToDto);
  }
}

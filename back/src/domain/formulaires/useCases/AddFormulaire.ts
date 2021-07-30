import { UseCase } from "../../core/UseCase";
import { FormulaireEntity } from "../entities/FormulaireEntity";
import { FormulaireRepository } from "../ports/FormulaireRepository";
import { FormulaireDto } from "../../../shared/FormulaireDto";

type AddFormulaireDependencies = { formulaireRepository: FormulaireRepository; };

export class AddFormulaire implements UseCase<FormulaireDto> {
    private readonly formulaireRepository: FormulaireRepository;

    constructor({ formulaireRepository }: AddFormulaireDependencies) {
        this.formulaireRepository = formulaireRepository;
    }

    public async execute(params: FormulaireDto) {
        const formulaire = FormulaireEntity.create(params);
        await this.formulaireRepository.save(formulaire);
    }
}

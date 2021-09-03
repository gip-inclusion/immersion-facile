import { DemandeImmersionDto } from "../../../shared/DemandeImmersionDto";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

type ListDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
};

export class ListDemandeImmersion
  implements UseCase<void, DemandeImmersionDto[]>
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;

  constructor({
    demandeImmersionRepository,
  }: ListDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
  }

  public async execute() {
    const entities = await this.demandeImmersionRepository.getAll();
    return entities.map((entity) => entity.toDto());
  }
}

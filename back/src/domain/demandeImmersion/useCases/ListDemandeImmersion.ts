import { DemandeImmersionDto } from "src/shared/DemandeImmersionDto";
import { UseCase } from "src/domain/core/UseCase";
import { DemandeImmersionRepository } from "src/domain/demandeImmersion/ports/DemandeImmersionRepository";

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

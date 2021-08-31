import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { DemandeImmersionDto } from "../../../shared/DemandeImmersionDto";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionIdEntity } from "../entities/DemandeImmersionIdEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

type GetDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
};

export class GetDemandeImmersion
  implements UseCase<DemandeImmersionIdEntity, DemandeImmersionDto>
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;

  constructor({ demandeImmersionRepository }: GetDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
  }

  public async execute(
    id: DemandeImmersionIdEntity
  ): Promise<DemandeImmersionDto> {
    const demandeImmersionEntity =
      await this.demandeImmersionRepository.getById(id);
    if (!demandeImmersionEntity) {
      throw new NotFoundError(id.id);
    }
    return demandeImmersionEntity.toDto();
  }
}

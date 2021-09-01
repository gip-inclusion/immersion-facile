import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";
import {
  AddDemandeImmersionResponseDto,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";

type AddDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
};

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;

  constructor({ demandeImmersionRepository }: AddDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
  }

  public async execute(
    params: DemandeImmersionDto
  ): Promise<AddDemandeImmersionResponseDto> {
    const demandeImmersionEntity = DemandeImmersionEntity.create(params);
    const id = await this.demandeImmersionRepository.save(
      demandeImmersionEntity
    );

    if (!id) throw new ConflictError(demandeImmersionEntity.id);

    return { id };
  }
}

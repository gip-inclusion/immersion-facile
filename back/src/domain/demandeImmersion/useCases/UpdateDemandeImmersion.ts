import { NotFoundError } from "src/adapters/primary/helpers/sendHttpResponse";
import { UseCase } from "src/domain/core/UseCase";
import { DemandeImmersionEntity } from "src/domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "src/domain/demandeImmersion/ports/DemandeImmersionRepository";
import {
  UpdateDemandeImmersionRequestDto,
  UpdateDemandeImmersionResponseDto,
} from "src/shared/DemandeImmersionDto";

type UpdateDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
};

export class UpdateDemandeImmersion
  implements
    UseCase<
      UpdateDemandeImmersionRequestDto,
      UpdateDemandeImmersionResponseDto
    >
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;

  constructor({
    demandeImmersionRepository,
  }: UpdateDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
  }

  public async execute(
    params: UpdateDemandeImmersionRequestDto
  ): Promise<UpdateDemandeImmersionResponseDto> {
    const demandeImmersionEntity = DemandeImmersionEntity.create(
      params.demandeImmersion
    );
    return this.demandeImmersionRepository
      .updateDemandeImmersion(demandeImmersionEntity)
      .then((id) => {
        if (!id) {
          throw new NotFoundError(params.id);
        }
        return params.demandeImmersion;
      });
  }
}

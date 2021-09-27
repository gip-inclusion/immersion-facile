import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandeImmersionDto,
  GetDemandeImmersionRequestDto,
} from "../../../shared/DemandeImmersionDto";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

export class GetDemandeImmersion
  implements UseCase<GetDemandeImmersionRequestDto, DemandeImmersionDto>
{
  constructor(
    readonly demandeImmersionRepository: DemandeImmersionRepository,
  ) {}

  public async execute({
    id,
  }: GetDemandeImmersionRequestDto): Promise<DemandeImmersionDto> {
    const demandeImmersionEntity =
      await this.demandeImmersionRepository.getById(id);
    if (!demandeImmersionEntity) throw new NotFoundError(id);
    return demandeImmersionEntity.toDto();
  }
}

import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandeImmersionDto,
  GetDemandeImmersionRequestDto
} from "../../../shared/DemandeImmersionDto";
import {
  FeatureDisabledError,
  FeatureFlags
} from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

type GetDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
  featureFlags: FeatureFlags;
};

export class GetDemandeImmersion
  implements UseCase<GetDemandeImmersionRequestDto, DemandeImmersionDto>
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;
  private readonly featureFlags: FeatureFlags;

  constructor({
    demandeImmersionRepository,
    featureFlags,
  }: GetDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
    this.featureFlags = featureFlags;
  }

  public async execute({
    id,
  }: GetDemandeImmersionRequestDto): Promise<DemandeImmersionDto> {
    if (!this.featureFlags.enableViewableApplications)
      throw new FeatureDisabledError();

    const demandeImmersionEntity =
      await this.demandeImmersionRepository.getById(id);
    if (!demandeImmersionEntity) throw new NotFoundError(id);
    return demandeImmersionEntity.toDto();
  }
}

import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  UpdateDemandeImmersionRequestDto,
  UpdateDemandeImmersionResponseDto
} from "../../../shared/DemandeImmersionDto";
import {
  FeatureDisabledError,
  FeatureFlags
} from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

type UpdateDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
  featureFlags: FeatureFlags;
};

export class UpdateDemandeImmersion
  implements
    UseCase<
      UpdateDemandeImmersionRequestDto,
      UpdateDemandeImmersionResponseDto
    >
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;
  private readonly featureFlags: FeatureFlags;

  constructor({
    demandeImmersionRepository,
    featureFlags,
  }: UpdateDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
    this.featureFlags = featureFlags;
  }

  public async execute(
    params: UpdateDemandeImmersionRequestDto
  ): Promise<UpdateDemandeImmersionResponseDto> {
    if (!this.featureFlags.enableViewableApplications)
      throw new FeatureDisabledError();

    const demandeImmersionEntity = DemandeImmersionEntity.create(
      params.demandeImmersion
    );
    const id = await this.demandeImmersionRepository.updateDemandeImmersion(
      demandeImmersionEntity
    );
    if (!id) throw new NotFoundError(params.id);
    return { id };
  }
}

import { DemandeImmersionDto } from "../../../shared/DemandeImmersionDto";
import {
  FeatureDisabledError,
  FeatureFlags
} from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

type ListDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
  featureFlags: FeatureFlags;
};

export class ListDemandeImmersion
  implements UseCase<void, DemandeImmersionDto[]>
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;
  private readonly featureFlags: FeatureFlags;

  constructor({
    demandeImmersionRepository,
    featureFlags,
  }: ListDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
    this.featureFlags = featureFlags;
  }

  public async execute() {
    if (!this.featureFlags.enableViewableApplications)
      throw new FeatureDisabledError();
    const entities = await this.demandeImmersionRepository.getAll();
    return entities.map((entity) => entity.toDto());
  }
}

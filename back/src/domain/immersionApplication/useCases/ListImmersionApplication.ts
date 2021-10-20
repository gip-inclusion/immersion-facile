import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

type ListImmersionApplicationDependencies = {
  immersionApplicationRepository: ImmersionApplicationRepository;
  featureFlags: FeatureFlags;
};

export class ListImmersionApplication
  implements UseCase<void, ImmersionApplicationDto[]>
{
  private readonly immersionApplicationRepository: ImmersionApplicationRepository;
  private readonly featureFlags: FeatureFlags;

  constructor({
    immersionApplicationRepository,
    featureFlags,
  }: ListImmersionApplicationDependencies) {
    this.immersionApplicationRepository = immersionApplicationRepository;
    this.featureFlags = featureFlags;
  }

  public async execute() {
    const entities = await this.immersionApplicationRepository.getAll();
    return entities.map((entity) => entity.toDto());
  }
}

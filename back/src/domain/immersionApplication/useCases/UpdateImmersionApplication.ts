import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  UpdateImmersionApplicationRequestDto,
  UpdateImmersionApplicationResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

type UpdateImmersionApplicationDependencies = {
  immersionApplicationRepository: ImmersionApplicationRepository;
  featureFlags: FeatureFlags;
};

export class UpdateImmersionApplication
  implements
    UseCase<
      UpdateImmersionApplicationRequestDto,
      UpdateImmersionApplicationResponseDto
    >
{
  private readonly immersionApplicationRepository: ImmersionApplicationRepository;
  private readonly featureFlags: FeatureFlags;

  constructor({
    immersionApplicationRepository,
    featureFlags,
  }: UpdateImmersionApplicationDependencies) {
    this.immersionApplicationRepository = immersionApplicationRepository;
    this.featureFlags = featureFlags;
  }

  public async execute(
    params: UpdateImmersionApplicationRequestDto,
  ): Promise<UpdateImmersionApplicationResponseDto> {
    if (
      !this.featureFlags.enableViewableApplications &&
      !this.featureFlags.enableMagicLinks
    )
      throw new FeatureDisabledError();
    const immersionApplicationEntity = ImmersionApplicationEntity.create(
      params.demandeImmersion,
    );
    const id =
      await this.immersionApplicationRepository.updateImmersionApplication(
        immersionApplicationEntity,
      );
    if (!id) throw new NotFoundError(params.id);
    return { id };
  }
}

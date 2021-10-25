import { z } from "zod";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { FeatureFlags } from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

export class ListImmersionApplication extends UseCase<
  void,
  ImmersionApplicationDto[]
> {
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = z.void();

  public async _execute() {
    const entities = await this.immersionApplicationRepository.getAll();
    return entities.map((entity) => entity.toDto());
  }
}

import { SetFeatureFlagParam, setFeatureFlagSchema } from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";

export class SetFeatureFlag extends TransactionalUseCase<SetFeatureFlagParam> {
  protected inputSchema = setFeatureFlagSchema;

  public async _execute(params: SetFeatureFlagParam, uow: UnitOfWork) {
    await uow.featureFlagRepository.update(params);
  }
}

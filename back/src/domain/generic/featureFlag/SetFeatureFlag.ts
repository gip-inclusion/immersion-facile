import { SetFeatureFlagParam, setFeatureFlagSchema } from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class SetFeatureFlag extends TransactionalUseCase<SetFeatureFlagParam> {
  inputSchema = setFeatureFlagSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(params: SetFeatureFlagParam, uow: UnitOfWork) {
    await uow.featureFlagRepository.update(params);
  }
}

import { SetFeatureFlagParams, setFeatureFlagSchema } from "shared";

import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class SetFeatureFlag extends TransactionalUseCase<SetFeatureFlagParams> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = setFeatureFlagSchema;

  public async _execute(params: SetFeatureFlagParams, uow: UnitOfWork) {
    await uow.featureFlagRepository.set(params);
  }
}

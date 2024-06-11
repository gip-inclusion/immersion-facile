import {
  InclusionConnectedUser,
  SetFeatureFlagParam,
  setFeatureFlagSchema,
} from "shared";
import { TransactionalUseCase } from "../../UseCase";
import { throwIfNotAdmin } from "../../authentication/inclusion-connect/helpers/ic-user.helpers";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export class SetFeatureFlag extends TransactionalUseCase<
  SetFeatureFlagParam,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = setFeatureFlagSchema;

  public async _execute(
    params: SetFeatureFlagParam,
    uow: UnitOfWork,
    currentUser: InclusionConnectedUser,
  ) {
    throwIfNotAdmin(currentUser);
    await uow.featureFlagRepository.update(params);
  }
}

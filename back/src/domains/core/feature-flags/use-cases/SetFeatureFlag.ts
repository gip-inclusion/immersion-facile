import {
  InclusionConnectedUser,
  SetFeatureFlagParam,
  setFeatureFlagSchema,
} from "shared";
import { throwIfNotAdmin } from "../../../inclusion-connected-users/helpers/authorization.helper";
import { TransactionalUseCase } from "../../UseCase";
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

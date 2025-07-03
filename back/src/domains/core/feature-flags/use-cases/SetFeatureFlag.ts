import {
  type ConnectedUser,
  type SetFeatureFlagParam,
  setFeatureFlagSchema,
} from "shared";
import { throwIfNotAdmin } from "../../../connected-users/helpers/authorization.helper";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export class SetFeatureFlag extends TransactionalUseCase<
  SetFeatureFlagParam,
  void,
  ConnectedUser
> {
  protected inputSchema = setFeatureFlagSchema;

  public async _execute(
    params: SetFeatureFlagParam,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ) {
    throwIfNotAdmin(currentUser);
    await uow.featureFlagRepository.update(params);
  }
}

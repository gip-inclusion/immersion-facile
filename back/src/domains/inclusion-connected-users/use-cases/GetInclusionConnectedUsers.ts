import { sort } from "ramda";
import {
  InclusionConnectedUser,
  WithUserFilters,
  withUserFiltersSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export class GetInclusionConnectedUsers extends TransactionalUseCase<
  WithUserFilters,
  InclusionConnectedUser[],
  InclusionConnectedUser
> {
  protected inputSchema = withUserFiltersSchema;

  protected async _execute(
    filters: WithUserFilters,
    uow: UnitOfWork,
    currentUser?: InclusionConnectedUser,
  ): Promise<InclusionConnectedUser[]> {
    throwIfNotAdmin(currentUser);
    return uow.userRepository
      .getWithFilter(
        filters,
        oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
      )
      .then(
        sort((a, b) =>
          a.lastName.toLowerCase() < b.lastName.toLowerCase() ? -1 : 1,
        ),
      );
  }
}

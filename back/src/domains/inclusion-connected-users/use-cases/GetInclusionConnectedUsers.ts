import {
  InclusionConnectedUser,
  WithUserFilters,
  isWithAgencyId,
  withUserFiltersSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwIfNotAdmin,
  throwIfNotAgencyAdminOrBackofficeAdmin,
} from "../helpers/authorization.helper";
import { getIcUsersByUserIds } from "../helpers/inclusionConnectedUser.helper";

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
    isWithAgencyId(filters)
      ? throwIfNotAgencyAdminOrBackofficeAdmin(filters.agencyId, currentUser)
      : throwIfNotAdmin(currentUser);

    const userIds =
      await uow.agencyRepository.getUserIdWithAgencyRightsByFilters(filters);

    const icUsers = await getIcUsersByUserIds(uow, userIds);

    return icUsers.sort((a, b) =>
      a.lastName.toLowerCase() < b.lastName.toLowerCase() ? -1 : 1,
    );
  }
}

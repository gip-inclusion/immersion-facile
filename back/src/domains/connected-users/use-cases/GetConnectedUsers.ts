import {
  type ConnectedUser,
  isWithAgencyId,
  type WithUserFilters,
  withUserFiltersSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwIfNotAdmin,
  throwIfNotAgencyAdminOrBackofficeAdmin,
} from "../helpers/authorization.helper";
import { getConnectedUsersByUserIds } from "../helpers/connectedUser.helper";

export class GetConnectedUsers extends TransactionalUseCase<
  WithUserFilters,
  ConnectedUser[],
  ConnectedUser
> {
  protected inputSchema = withUserFiltersSchema;

  protected async _execute(
    filters: WithUserFilters,
    uow: UnitOfWork,
    currentUser?: ConnectedUser,
  ): Promise<ConnectedUser[]> {
    isWithAgencyId(filters)
      ? throwIfNotAgencyAdminOrBackofficeAdmin(filters.agencyId, currentUser)
      : throwIfNotAdmin(currentUser);

    const userIds =
      await uow.agencyRepository.getUserIdWithAgencyRightsByFilters(filters);

    const users = await getConnectedUsersByUserIds(uow, userIds);

    return users.sort((a, b) =>
      a.lastName.toLowerCase() < b.lastName.toLowerCase() ? -1 : 1,
    );
  }
}

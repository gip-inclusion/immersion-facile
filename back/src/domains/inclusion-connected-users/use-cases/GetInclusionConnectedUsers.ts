import {
  InclusionConnectedUser,
  WithUserFilters,
  withUserFiltersSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getIcUserByUserId } from "../helpers/inclusionConnectedUser.helper";
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
    const userIds = await uow.agencyRepository.getUserIdByFilters(filters);
    const icUsers = await Promise.all(
      userIds.map((id) => getIcUserByUserId(uow, id)),
    );
    return icUsers.sort((a, b) =>
      a.lastName.toLowerCase() < b.lastName.toLowerCase() ? -1 : 1,
    );
  }
}

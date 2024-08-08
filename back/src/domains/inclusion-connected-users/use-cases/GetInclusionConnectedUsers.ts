import {
  InclusionConnectedUser,
  WithUserFilters,
  withUserFiltersSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
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
    return uow.userRepository.getWithFilter(filters);
  }
}

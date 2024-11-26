import {
  InclusionConnectedUser,
  WithUserFilters,
  errors,
  isWithAgencyId,
  withUserFiltersSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
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
    throwIfNotAgencyAdminOrBackofficeAdmin(filters, currentUser);

    const userIds =
      await uow.agencyRepository.getUserIdWithAgencyRightsByFilters(filters);

    const icUsers = await getIcUsersByUserIds(uow, userIds);

    return icUsers.sort((a, b) =>
      a.lastName.toLowerCase() < b.lastName.toLowerCase() ? -1 : 1,
    );
  }
}

const throwIfNotAgencyAdminOrBackofficeAdmin = (
  filters: WithUserFilters,
  currentUser?: InclusionConnectedUser,
): void => {
  if (!currentUser) throw errors.user.unauthorized();
  if (currentUser.isBackofficeAdmin) return;
  if (!isWithAgencyId(filters))
    throw errors.user.forbidden({ userId: currentUser.id });

  const hasPermission = currentUser.agencyRights.some(
    (agencyRight) =>
      agencyRight.agency.id === filters.agencyId &&
      agencyRight.roles.includes("agency-admin"),
  );

  if (!hasPermission) {
    throw errors.user.forbidden({ userId: currentUser.id });
  }
};

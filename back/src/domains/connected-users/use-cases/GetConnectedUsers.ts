import {
  type ConnectedUser,
  isWithAgencyId,
  withUserFiltersSchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import {
  throwIfNotAdmin,
  throwIfNotAgencyAdminOrBackofficeAdmin,
} from "../helpers/authorization.helper";
import { getConnectedUsersByUserIds } from "../helpers/connectedUser.helper";

export type GetConnectedUsers = ReturnType<typeof makeGetConnectedUsers>;
export const makeGetConnectedUsers = useCaseBuilder("GetConnectedUsers")
  .withInput(withUserFiltersSchema)
  .withCurrentUser<ConnectedUser>()
  .withOutput<ConnectedUser[]>()
  .build(async ({ uow, currentUser, inputParams: filters }) => {
    isWithAgencyId(filters)
      ? throwIfNotAgencyAdminOrBackofficeAdmin(filters.agencyId, currentUser)
      : throwIfNotAdmin(currentUser);

    const userIds =
      await uow.agencyRepository.getUserIdWithAgencyRightsByFilters(filters);

    const agencyId = isWithAgencyId(filters) ? filters.agencyId : undefined;

    const users = await getConnectedUsersByUserIds(uow, userIds, agencyId);

    return users.sort((a, b) =>
      a.lastName.toLowerCase() < b.lastName.toLowerCase() ? -1 : 1,
    );
  });

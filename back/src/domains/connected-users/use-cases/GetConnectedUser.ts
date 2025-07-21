import { type ConnectedUser, withOptionalUserIdSchema } from "shared";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwIfNotAdmin } from "../helpers/authorization.helper";
import { getConnectedUserByUserId } from "../helpers/connectedUser.helper";

export type GetConnectedUser = ReturnType<typeof makeGetConnectedUser>;
export const makeGetConnectedUser = useCaseBuilder("GetConnectedUser")
  .withInput(withOptionalUserIdSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    dashboardGateway: DashboardGateway;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ uow, currentUser, deps, inputParams }) => {
    if (inputParams.userId) throwIfNotAdmin(currentUser);

    const userIdToFetch = inputParams.userId ?? currentUser.id;

    return getConnectedUserByUserId({
      uow,
      userId: userIdToFetch,
      dashboardGateway: deps.dashboardGateway,
      timeGateway: deps.timeGateway,
    });
  });

import { filter, map, switchMap } from "rxjs";

import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type InclusionConnectedAction = ActionOfSlice<typeof inclusionConnectedSlice>;

const getAgencyDashboardEpic: AppEpic<InclusionConnectedAction> = (
  action$,
  state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(
      inclusionConnectedSlice.actions.agencyDashboardUrlFetchRequested.match,
    ),
    switchMap(() =>
      inclusionConnectedGateway.getMyAgencyDashboardUrl$(
        state$.value.auth.federatedIdentityWithUser?.token ?? "",
      ),
    ),
    map(inclusionConnectedSlice.actions.agencyDashboardUrlFetchSucceeded),
    catchEpicError((error) =>
      error?.message.includes("jwt expired")
        ? authSlice.actions.federatedIdentityDeletionTriggered()
        : inclusionConnectedSlice.actions.agencyDashboardUrlFetchFailed(
            error?.message,
          ),
    ),
  );
export const inclusionConnectedEpics = [getAgencyDashboardEpic];

import { filter, map, switchMap } from "rxjs";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type InclusionConnectedAction = ActionOfSlice<typeof inclusionConnectedSlice>;

const federatedIdentityFoundInDeviceEpic: AppEpic<InclusionConnectedAction> = (
  action$,
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityFoundInDevice.match),
    filter((action) => action.payload?.provider === "inclusionConnect"),
    map(() => inclusionConnectedSlice.actions.currentUserFetchRequested()),
  );

const getCurrentUserEpic: AppEpic<InclusionConnectedAction> = (
  action$,
  state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(inclusionConnectedSlice.actions.currentUserFetchRequested.match),
    switchMap(() =>
      inclusionConnectedGateway.getCurrentUser$(
        state$.value.auth.federatedIdentityWithUser?.token ?? "",
      ),
    ),
    map(inclusionConnectedSlice.actions.currentUserFetchSucceeded),
    catchEpicError((error) =>
      error?.message.includes("jwt expired")
        ? authSlice.actions.federatedIdentityDeletionTriggered()
        : inclusionConnectedSlice.actions.currentUserFetchFailed(
            error?.message,
          ),
    ),
  );

const registerAgenciesEpic: AppEpic<InclusionConnectedAction> = (
  action$,
  state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(inclusionConnectedSlice.actions.registerAgenciesRequested.match),
    switchMap((action) =>
      inclusionConnectedGateway.registerAgenciesToCurrentUser$(
        action.payload.agencies,
        state$.value.auth.federatedIdentityWithUser?.token ?? "",
      ),
    ),
    map(inclusionConnectedSlice.actions.registerAgenciesSucceeded),
    catchEpicError((error) =>
      inclusionConnectedSlice.actions.registerAgenciesFailed(error?.message),
    ),
  );

export const inclusionConnectedEpics = [
  getCurrentUserEpic,
  registerAgenciesEpic,
  federatedIdentityFoundInDeviceEpic,
];

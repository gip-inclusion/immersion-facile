import { filter, map, switchMap } from "rxjs";
import { connectedUserTokenExpiredMessage } from "shared";
import type { AuthAction } from "src/core-logic/domain/auth/auth.epics";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type InclusionConnectedAction = ActionOfSlice<typeof inclusionConnectedSlice>;
type InclusionConnectedEpic = AppEpic<InclusionConnectedAction | AuthAction>;

const federatedIdentityFoundInDeviceEpic: InclusionConnectedEpic = (action$) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityFoundInDevice.match),
    filter(
      (action) =>
        action.payload?.federatedIdentityWithUser?.provider === "proConnect" ||
        action.payload?.federatedIdentityWithUser?.provider === "email",
    ),
    map((action) =>
      inclusionConnectedSlice.actions.currentUserFetchRequested({
        feedbackTopic: action.payload?.feedbackTopic,
      }),
    ),
  );

const federatedIdentityFromStoreToDeviceStorageSucceededEpic: InclusionConnectedEpic =
  (action$) =>
    action$.pipe(
      filter(
        authSlice.actions.federatedIdentityFromStoreToDeviceStorageSucceeded
          .match,
      ),
      filter(
        (action) =>
          action.payload?.federatedIdentityWithUser.provider === "proConnect" ||
          action.payload?.federatedIdentityWithUser.provider === "email",
      ),
      map((action) =>
        inclusionConnectedSlice.actions.currentUserFetchRequested({
          feedbackTopic: action.payload?.feedbackTopic,
        }),
      ),
    );

const getCurrentUserEpic: InclusionConnectedEpic = (
  action$,
  state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(
      (action) =>
        inclusionConnectedSlice.actions.currentUserFetchRequested.match(
          action,
        ) ||
        inclusionConnectedSlice.actions.registerAgenciesSucceeded.match(action),
    ),
    switchMap(({ payload }) =>
      inclusionConnectedGateway
        .getCurrentUser$(
          state$.value.auth.federatedIdentityWithUser?.token ?? "",
        )
        .pipe(
          map(inclusionConnectedSlice.actions.currentUserFetchSucceeded),
          catchEpicError((error) =>
            error?.message.includes(connectedUserTokenExpiredMessage)
              ? authSlice.actions.federatedIdentityDeletionTriggered({
                  mode: "device-only",
                })
              : inclusionConnectedSlice.actions.currentUserFetchFailed({
                  errorMessage: error?.message,
                  feedbackTopic: payload.feedbackTopic,
                }),
          ),
        ),
    ),
  );

const registerAgenciesEpic: InclusionConnectedEpic = (
  action$,
  state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(inclusionConnectedSlice.actions.registerAgenciesRequested.match),
    switchMap((action) =>
      inclusionConnectedGateway
        .registerAgenciesToCurrentUser$(
          action.payload.agencies,
          state$.value.auth.federatedIdentityWithUser?.token ?? "",
        )
        .pipe(
          map(() =>
            inclusionConnectedSlice.actions.registerAgenciesSucceeded({
              feedbackTopic: action.payload.feedbackTopic,
              agencies: action.payload.agencies,
            }),
          ),
          catchEpicError((error) =>
            inclusionConnectedSlice.actions.registerAgenciesFailed({
              feedbackTopic: action.payload.feedbackTopic,
              errorMessage: error?.message,
            }),
          ),
        ),
    ),
  );

export const inclusionConnectedEpics = [
  getCurrentUserEpic,
  registerAgenciesEpic,
  federatedIdentityFoundInDeviceEpic,
  federatedIdentityFromStoreToDeviceStorageSucceededEpic,
];

import { filter, map, switchMap } from "rxjs";
import { authExpiredMessage } from "shared";
import type { AuthAction } from "src/core-logic/domain/auth/auth.epics";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSlice } from "src/core-logic/domain/connected-user/connectedUser.slice";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type ConnectedUserAction = ActionOfSlice<typeof connectedUserSlice>;
type ConnectedUserEpic = AppEpic<ConnectedUserAction | AuthAction>;

const federatedIdentityFoundInDeviceEpic: ConnectedUserEpic = (action$) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityFoundInDevice.match),
    filter(
      (action) =>
        action.payload?.federatedIdentityWithUser?.provider === "proConnect" ||
        action.payload?.federatedIdentityWithUser?.provider === "email",
    ),
    map((action) =>
      connectedUserSlice.actions.currentUserFetchRequested({
        feedbackTopic: action.payload?.feedbackTopic,
      }),
    ),
  );

const federatedIdentityFromStoreToDeviceStorageSucceededEpic: ConnectedUserEpic =
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
        connectedUserSlice.actions.currentUserFetchRequested({
          feedbackTopic: action.payload?.feedbackTopic,
        }),
      ),
    );

const getCurrentUserEpic: ConnectedUserEpic = (
  action$,
  state$,
  { authGateway },
) =>
  action$.pipe(
    filter(
      (action) =>
        connectedUserSlice.actions.currentUserFetchRequested.match(action) ||
        connectedUserSlice.actions.registerAgenciesSucceeded.match(action) ||
        establishmentSlice.actions.updateEstablishmentSucceeded.match(action),
    ),
    switchMap(({ payload }) =>
      authGateway
        .getCurrentUser$(
          state$.value.auth.federatedIdentityWithUser?.token ?? "",
        )
        .pipe(
          map(connectedUserSlice.actions.currentUserFetchSucceeded),
          catchEpicError((error) =>
            error?.message.includes(authExpiredMessage)
              ? authSlice.actions.federatedIdentityDeletionTriggered({
                  mode: "device-only",
                })
              : connectedUserSlice.actions.currentUserFetchFailed({
                  errorMessage: error?.message,
                  feedbackTopic: payload.feedbackTopic,
                }),
          ),
        ),
    ),
  );

const registerAgenciesEpic: ConnectedUserEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(connectedUserSlice.actions.registerAgenciesRequested.match),
    switchMap((action) =>
      agencyGateway
        .registerAgenciesToCurrentUser$(
          action.payload.agencies,
          state$.value.auth.federatedIdentityWithUser?.token ?? "",
        )
        .pipe(
          map(() =>
            connectedUserSlice.actions.registerAgenciesSucceeded({
              feedbackTopic: action.payload.feedbackTopic,
              agencies: action.payload.agencies,
            }),
          ),
          catchEpicError((error) =>
            connectedUserSlice.actions.registerAgenciesFailed({
              feedbackTopic: action.payload.feedbackTopic,
              errorMessage: error?.message,
            }),
          ),
        ),
    ),
  );

export const connectedUserEpics = [
  getCurrentUserEpic,
  registerAgenciesEpic,
  federatedIdentityFoundInDeviceEpic,
  federatedIdentityFromStoreToDeviceStorageSucceededEpic,
];

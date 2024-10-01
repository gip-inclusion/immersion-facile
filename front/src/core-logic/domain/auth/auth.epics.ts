import { filter, map, of, tap } from "rxjs";
import { switchMap } from "rxjs/operators";
import { errors } from "shared";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { authSlice } from "./auth.slice";

export type AuthAction = ActionOfSlice<typeof authSlice>;
type AuthEpic = AppEpic<AuthAction>;

const storeRedirectionUrlAfterLoginInDevice: AuthEpic = (
  action$,
  _,
  { sessionDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.saveRedirectionAfterLoginRequested.match),
    map(({ payload }) => {
      sessionDeviceRepository.set("afterLoginRedirectionUrl", payload.url);
      return authSlice.actions.saveRedirectAfterLoginSucceeded({
        url: payload.url,
      });
    }),
  );

const clearRedirectAfterLoginFromDevice: AuthEpic = (
  action$,
  _,
  { sessionDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.clearRedirectAfterLoginRequested.match),
    map(() => {
      sessionDeviceRepository.delete("afterLoginRedirectionUrl");
      return authSlice.actions.clearRedirectAfterLoginSucceeded();
    }),
  );

const storeFederatedIdentityInDevice: AuthEpic = (
  action$,
  state$,
  { localDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityProvided.match),
    tap(() => {
      if (state$.value.auth.federatedIdentityWithUser)
        localDeviceRepository.set(
          "federatedIdentityWithUser",
          state$.value.auth.federatedIdentityWithUser,
        );
      return state$.value.auth.federatedIdentityWithUser;
    }),
    map(({ payload }) =>
      authSlice.actions.federatedIdentityFromStoreToDeviceStorageSucceeded(
        payload,
      ),
    ),
  );

const deleteFederatedIdentityFromDevice: AuthEpic = (
  action$,
  _,
  { localDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityDeletionTriggered.match),
    tap(() => localDeviceRepository.delete("federatedIdentityWithUser")),
    tap(() => localDeviceRepository.delete("partialConventionInUrl")),
    map(() => authSlice.actions.federatedIdentityInDeviceDeletionSucceeded()),
  );

const logoutFromInclusionConnect: AuthEpic = (
  action$,
  state$,
  { inclusionConnectedGateway, navigationGateway },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityDeletionTriggered.match),
    switchMap((action) => {
      const { federatedIdentityWithUser } = state$.value.auth;
      if (!federatedIdentityWithUser)
        throw errors.inclusionConnect.missingOAuth({});
      const { provider } = federatedIdentityWithUser;
      if (
        provider === "inclusionConnect" &&
        action.payload.mode === "device-and-inclusion"
      ) {
        const { idToken } = federatedIdentityWithUser;
        return inclusionConnectedGateway.getLogoutUrl$({
          idToken: state$.value.auth.federatedIdentityWithUser ? idToken : "",
        });
      }
      return of(undefined);
    }),
    map((logoutUrl) => {
      if (logoutUrl) navigationGateway.goToUrl(logoutUrl);
      return authSlice.actions.loggedOutSuccessfullyFromProvider();
    }),
    catchEpicError((_error) =>
      authSlice.actions.loggedOutFailedFromInclusionConnect(),
    ),
  );

const checkConnectedWithFederatedIdentity: AuthEpic = (
  action$,
  _,
  { localDeviceRepository },
) =>
  action$.pipe(
    filter(rootAppSlice.actions.appIsReady.match),
    map(() => {
      const federatedIdentity = localDeviceRepository.get(
        "federatedIdentityWithUser",
      );
      return federatedIdentity
        ? authSlice.actions.federatedIdentityFoundInDevice(federatedIdentity)
        : authSlice.actions.federatedIdentityNotFoundInDevice();
    }),
  );

export const authEpics = [
  storeFederatedIdentityInDevice,
  checkConnectedWithFederatedIdentity,
  logoutFromInclusionConnect,
  deleteFederatedIdentityFromDevice,
  storeRedirectionUrlAfterLoginInDevice,
  clearRedirectAfterLoginFromDevice,
];

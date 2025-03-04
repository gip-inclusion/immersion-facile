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

const clearAndRedirectAfterLoginFromDevice: AuthEpic = (
  action$,
  state$,
  { sessionDeviceRepository, navigationGateway },
) =>
  action$.pipe(
    filter(authSlice.actions.redirectAndClearUrlAfterLoginRequested.match),
    tap(() => {
      sessionDeviceRepository.delete("afterLoginRedirectionUrl");
    }),
    map(() => authSlice.actions.redirectAndClearUrlAfterLoginSucceeded()),
    tap(() => {
      if (state$.value.auth.afterLoginRedirectionUrl)
        navigationGateway.goToUrl(state$.value.auth.afterLoginRedirectionUrl);
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
    map(({ payload }) => {
      if (!payload.federatedIdentityWithUser)
        return authSlice.actions.federatedIdentityNotFoundInDevice();
      return authSlice.actions.federatedIdentityFromStoreToDeviceStorageSucceeded(
        {
          federatedIdentityWithUser: payload.federatedIdentityWithUser,
          feedbackTopic: "auth-global",
        },
      );
    }),
  );

const deleteFederatedIdentityFromDevice: AuthEpic = (
  action$,
  _,
  { localDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityDeletionTriggered.match),
    tap(() => localDeviceRepository.delete("federatedIdentityWithUser")),
    tap(() => localDeviceRepository.delete("connectedUserSiret")),
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
        provider === "connectedUser" &&
        action.payload.mode === "device-and-inclusion"
      ) {
        const { idToken } = federatedIdentityWithUser;
        return inclusionConnectedGateway.getLogoutUrl$({
          idToken: state$.value.auth.federatedIdentityWithUser ? idToken : "",
          authToken: state$.value.auth.federatedIdentityWithUser?.token ?? "",
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
        ? authSlice.actions.federatedIdentityFoundInDevice({
            federatedIdentityWithUser: federatedIdentity,
            feedbackTopic: "auth-global",
          })
        : authSlice.actions.federatedIdentityNotFoundInDevice();
    }),
  );

const checkRedirectionAfterLogin: AuthEpic = (
  action$,
  _,
  { sessionDeviceRepository },
) =>
  action$.pipe(
    filter(rootAppSlice.actions.appIsReady.match),
    map(() => {
      const afterLoginRedirectionUrl = sessionDeviceRepository.get(
        "afterLoginRedirectionUrl",
      );
      return afterLoginRedirectionUrl
        ? authSlice.actions.redirectionAfterLoginFoundInDevice({
            url: afterLoginRedirectionUrl,
          })
        : authSlice.actions.redirectionAfterLoginNotFoundInDevice();
    }),
  );

export const authEpics = [
  storeFederatedIdentityInDevice,
  checkConnectedWithFederatedIdentity,
  logoutFromInclusionConnect,
  deleteFederatedIdentityFromDevice,
  storeRedirectionUrlAfterLoginInDevice,
  clearAndRedirectAfterLoginFromDevice,
  checkRedirectionAfterLogin,
];

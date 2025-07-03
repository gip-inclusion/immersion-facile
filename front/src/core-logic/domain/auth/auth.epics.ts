import { filter, map, of, tap } from "rxjs";
import { switchMap } from "rxjs/operators";
import { errors } from "shared";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
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
    tap(() => localDeviceRepository.delete("partialConventionInUrl")),
    map(() => authSlice.actions.federatedIdentityInDeviceDeletionSucceeded()),
  );

const logout: AuthEpic = (
  action$,
  state$,
  { navigationGateway, authGateway },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityDeletionTriggered.match),
    switchMap((action) => {
      const { federatedIdentityWithUser } = state$.value.auth;
      if (!federatedIdentityWithUser) throw errors.proConnect.missingOAuth({});
      const { provider } = federatedIdentityWithUser;
      if (
        provider === "proConnect" &&
        action.payload.mode === "device-and-oauth"
      ) {
        const { idToken } = federatedIdentityWithUser;
        return authGateway.getLogoutUrl$({
          idToken: state$.value.auth.federatedIdentityWithUser ? idToken : "",
          authToken: state$.value.auth.federatedIdentityWithUser?.token ?? "",
        });
      }
      return of(undefined);
    }),
    map((logoutUrl) => {
      if (logoutUrl) navigationGateway.goToUrl(logoutUrl);
      return authSlice.actions.logOutFromProviderSucceeded();
    }),
    catchEpicError((_error) => authSlice.actions.logOutFromProviderFailed()),
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

const requestLoginByEmail: AuthEpic = (action$, _, { authGateway }) =>
  action$.pipe(
    filter(authSlice.actions.loginByEmailRequested.match),
    switchMap((action) =>
      authGateway
        .loginByEmail$({
          email: action.payload.email,
          redirectUri: action.payload.redirectUri,
        })
        .pipe(
          map(() =>
            authSlice.actions.loginByEmailSucceded({
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            authSlice.actions.loginByEmailFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const authEpics = [
  storeFederatedIdentityInDevice,
  checkConnectedWithFederatedIdentity,
  logout,
  deleteFederatedIdentityFromDevice,
  storeRedirectionUrlAfterLoginInDevice,
  clearAndRedirectAfterLoginFromDevice,
  checkRedirectionAfterLogin,
  requestLoginByEmail,
];

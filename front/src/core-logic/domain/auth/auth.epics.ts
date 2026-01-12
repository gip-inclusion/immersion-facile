import type { PayloadAction } from "@reduxjs/toolkit";
import { filter, map, type Observable, of, tap, throwError } from "rxjs";
import { switchMap } from "rxjs/operators";
import {
  type AbsoluteUrl,
  errors,
  isFederatedIdentityProviderWithLogoutCallback,
} from "shared";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";
import type {
  DeviceRepository,
  LocalStoragePair,
} from "src/core-logic/ports/DeviceRepository";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { type AuthState, authSlice } from "./auth.slice";

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

const redirectToProviderLogoutPage: AuthEpic = (
  action$,
  _,
  { navigationGateway },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityInDeviceDeletionSucceeded.match),
    tap((action) => {
      if (action.payload) {
        navigationGateway.goToUrl(action.payload);
      }
    }),
    map(() => authSlice.actions.redirectAfterLogoutSucceeded()),
  );

const removeFederatedIdentityFromDevice = ({
  localDeviceRepository,
}: {
  localDeviceRepository: DeviceRepository<LocalStoragePair>;
}) => {
  localDeviceRepository.delete("federatedIdentityWithUser");
  localDeviceRepository.delete("partialConventionInUrl");
  localDeviceRepository.delete("conventionDraftId");
};

const deleteFederatedIdentityFromDevice: AuthEpic = (
  action$,
  _,
  { localDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.fetchLogoutUrlSucceeded.match),
    tap(() => removeFederatedIdentityFromDevice({ localDeviceRepository })),
    map((action) =>
      authSlice.actions.federatedIdentityInDeviceDeletionSucceeded(
        action.payload.url,
      ),
    ),
  );

const getLogoutUrl$ = (
  action: PayloadAction<{
    mode: "device-only" | "device-and-oauth";
  }>,
  authState: AuthState,
  authGateway: AuthGateway,
): Observable<AbsoluteUrl | undefined> => {
  const { federatedIdentityWithUser } = authState;
  if (!federatedIdentityWithUser)
    return throwError(() => errors.auth.missingOAuth({}));
  const { provider } = federatedIdentityWithUser;
  if (
    isFederatedIdentityProviderWithLogoutCallback(provider) &&
    action.payload.mode === "device-and-oauth"
  ) {
    const { idToken } = federatedIdentityWithUser;
    return authGateway.getLogoutUrl$({
      idToken: authState.federatedIdentityWithUser ? idToken : "",
      authToken: authState.federatedIdentityWithUser?.token ?? "",
      provider,
    });
  }
  return of(undefined);
};

const logoutEpic: AuthEpic = (
  action$,
  state$,
  { authGateway, localDeviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.fetchLogoutUrlRequested.match),
    switchMap((action) =>
      getLogoutUrl$(action, state$.value.auth, authGateway).pipe(
        map((logoutUrl) => {
          return authSlice.actions.fetchLogoutUrlSucceeded({
            url: logoutUrl,
            feedbackTopic: action.payload.feedbackTopic,
          });
        }),
        catchEpicError((_error) => {
          removeFederatedIdentityFromDevice({ localDeviceRepository });
          return authSlice.actions.fetchLogoutUrlFailed({
            feedbackTopic: action.payload.feedbackTopic,
          });
        }),
      ),
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

const confirmLoginByMagicLink: AuthEpic = (
  action$,
  _,
  { authGateway, navigationGateway },
) =>
  action$.pipe(
    filter(authSlice.actions.confirmLoginByMagicLinkRequested.match),
    switchMap((action) =>
      authGateway
        .confirmLoginByMagicLink$({
          code: action.payload.code,
          state: action.payload.state,
        })
        .pipe(
          map((response) => {
            const { redirectUri } = response;
            navigationGateway.goToUrl(redirectUri);
            return authSlice.actions.confirmLoginByMagicLinkSucceeded({
              ...response,
              feedbackTopic: action.payload.feedbackTopic,
            });
          }),
          catchEpicError((error) =>
            authSlice.actions.confirmLoginByMagicLinkFailed({
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
  logoutEpic,
  deleteFederatedIdentityFromDevice,
  storeRedirectionUrlAfterLoginInDevice,
  clearAndRedirectAfterLoginFromDevice,
  checkRedirectionAfterLogin,
  requestLoginByEmail,
  confirmLoginByMagicLink,
  redirectToProviderLogoutPage,
];

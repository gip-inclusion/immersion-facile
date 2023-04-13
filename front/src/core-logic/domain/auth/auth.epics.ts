import { filter, map, tap } from "rxjs";

import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import { appIsReadyAction } from "../actions";

import { authSlice } from "./auth.slice";

type AuthAction = ActionOfSlice<typeof authSlice>;
type AuthEpic = AppEpic<AuthAction>;

const storeFederatedIdentityInDevice: AuthEpic = (
  action$,
  state$,
  { deviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityProvided.match),
    tap(() => {
      if (state$.value.auth.federatedIdentityWithUser)
        deviceRepository.set(
          "federatedIdentityWithUser",
          state$.value.auth.federatedIdentityWithUser,
        );
    }),
    map(() =>
      authSlice.actions.federatedIdentityFromStoreToDeviceStorageSucceeded(),
    ),
  );

const deleteFederatedIdentityFromDevice: AuthEpic = (
  action$,
  _,
  { deviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityDeletionTriggered.match),
    tap(() => deviceRepository.delete("federatedIdentityWithUser")),
    map(() => authSlice.actions.federatedIdentityInDeviceDeletionSucceeded()),
  );

const checkConnectedWithFederatedIdentity: AuthEpic = (
  action$,
  _,
  { deviceRepository },
) =>
  action$.pipe(
    filter(appIsReadyAction.match),
    map(() => {
      const federatedIdentity = deviceRepository.get(
        "federatedIdentityWithUser",
      );
      if (federatedIdentity)
        return authSlice.actions.federatedIdentityFoundInDevice(
          federatedIdentity,
        );
      return authSlice.actions.federatedIdentityNotFoundInDevice();
    }),
  );

export const authEpics = [
  storeFederatedIdentityInDevice,
  checkConnectedWithFederatedIdentity,
  deleteFederatedIdentityFromDevice,
];

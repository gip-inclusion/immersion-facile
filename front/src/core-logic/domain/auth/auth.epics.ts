import { filter, map, tap } from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { AppIsReadyAction } from "../commonActions";
import { authSlice } from "./auth.slice";

type AuthAction = ActionOfSlice<typeof authSlice>;
type AuthEpic = AppEpic<AuthAction>;

const storeFederatedIdentityInDevice: AuthEpic = (
  action$,
  state$,
  { deviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityInDeviceStorageTriggered.match),
    tap(() => {
      if (state$.value.auth.connectedWith)
        deviceRepository.set(
          "federatedIdentity",
          state$.value.auth.connectedWith,
        );
    }),
    map(() => authSlice.actions.federatedIdentityInDeviceStorageSucceeded()),
  );

const deleteFederatedIdentityFromDevice: AuthEpic = (
  action$,
  _,
  { deviceRepository },
) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityInDeviceDeletionTriggered.match),
    tap(() => deviceRepository.delete("federatedIdentity")),
    map(() => authSlice.actions.federatedIdentityInDeviceDeletionSucceeded()),
  );

const checkConnectedWithFederatedIdentity: AuthEpic = (
  action$,
  _,
  { deviceRepository },
) =>
  action$.pipe(
    filter(AppIsReadyAction.match),
    map(() => {
      const federatedIdentity = deviceRepository.get("federatedIdentity");
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

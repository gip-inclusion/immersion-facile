import { filter, map, switchMap, tap } from "rxjs";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type AdminAuthAction = ActionOfSlice<typeof adminAuthSlice>;
type AdminEpic = AppEpic<AdminAuthAction>;

const callLoginEpic: AdminEpic = (action$, _, { adminGateway }) =>
  action$.pipe(
    filter(adminAuthSlice.actions.loginRequested.match),
    switchMap((action) => adminGateway.login$(action.payload)),
    map(adminAuthSlice.actions.loginSucceeded),
    catchEpicError((error) =>
      adminAuthSlice.actions.loginFailed(error.message),
    ),
  );

const storeTokenInDevice: AdminEpic = (action$, _, { localDeviceRepository }) =>
  action$.pipe(
    filter(adminAuthSlice.actions.loginSucceeded.match),
    tap(({ payload }) => localDeviceRepository.set("adminToken", payload)),
    map(adminAuthSlice.actions.adminTokenStoredInDevice),
  );

const checkIfAdminLoggedIn: AdminEpic = (
  action$,
  _,
  { localDeviceRepository },
) =>
  action$.pipe(
    filter(rootAppSlice.actions.appIsReady.match),
    map(() => {
      const token = localDeviceRepository.get("adminToken");
      if (token) return adminAuthSlice.actions.tokenFoundInDevice(token);
      return adminAuthSlice.actions.noTokenFoundInDevice();
    }),
  );

const logout: AdminEpic = (action$, _, { localDeviceRepository }) =>
  action$.pipe(
    filter(adminAuthSlice.actions.logoutRequested.match),
    tap(() => localDeviceRepository.delete("adminToken")),
    map(adminAuthSlice.actions.loggedOut),
  );

export const adminAuthEpics = [
  callLoginEpic,
  storeTokenInDevice,
  checkIfAdminLoggedIn,
  logout,
];

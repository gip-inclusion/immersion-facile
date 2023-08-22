import { filter, map, switchMap, tap } from "rxjs";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { appIsReadyAction } from "../../actions";

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

const storeTokenInDevice: AdminEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(adminAuthSlice.actions.loginSucceeded.match),
    tap(({ payload }) => deviceRepository.set("adminToken", payload)),
    map(adminAuthSlice.actions.adminTokenStoredInDevice),
  );

const checkIfAdminLoggedIn: AdminEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(appIsReadyAction.match),
    map(() => {
      const token = deviceRepository.get("adminToken");
      if (token) return adminAuthSlice.actions.tokenFoundInDevice(token);
      return adminAuthSlice.actions.noTokenFoundInDevice();
    }),
  );

const logout: AdminEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(adminAuthSlice.actions.logoutRequested.match),
    tap(() => deviceRepository.delete("adminToken")),
    map(adminAuthSlice.actions.loggedOut),
  );

export const adminAuthEpics = [
  callLoginEpic,
  storeTokenInDevice,
  checkIfAdminLoggedIn,
  logout,
];

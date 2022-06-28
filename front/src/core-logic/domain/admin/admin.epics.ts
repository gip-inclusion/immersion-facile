import { filter, map, switchMap, tap } from "rxjs";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type AdminAction = ActionOfSlice<typeof adminSlice>;
type AdminEpic = AppEpic<AdminAction>;

const callLoginEpic: AdminEpic = (action$, _, { adminGateway }) =>
  action$.pipe(
    filter(adminSlice.actions.loginRequested.match),
    switchMap((action) => adminGateway.login(action.payload)),
    map(adminSlice.actions.loginSucceeded),
    catchEpicError((error) => adminSlice.actions.loginFailed(error.message)),
  );

const storeTokenInDevice: AdminEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(adminSlice.actions.loginSucceeded.match),
    tap(({ payload }) => deviceRepository.set("adminToken", payload)),
    map(adminSlice.actions.adminTokenStoredInDevice),
  );

const checkIfAdminLoggedIn: AdminEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(adminSlice.actions.checkIfLoggedInRequested.match),
    map(() => {
      const token = deviceRepository.get("adminToken");
      if (token) return adminSlice.actions.tokenFoundInDevice();
      return adminSlice.actions.noTokenFoundInDevice();
    }),
  );

const logout: AdminEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(adminSlice.actions.logoutRequested.match),
    tap(() => deviceRepository.delete("adminToken")),
    map(adminSlice.actions.loggedOut),
  );

export const adminEpics = [
  callLoginEpic,
  storeTokenInDevice,
  checkIfAdminLoggedIn,
  logout,
];

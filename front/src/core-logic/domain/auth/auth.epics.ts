import { filter, map, tap } from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { authSlice } from "./auth.slice";

type AuthAction = ActionOfSlice<typeof authSlice>;
type AuthEpic = AppEpic<AuthAction>;

const storeTokenInDevice: AuthEpic = (action$, _, { deviceRepository }) =>
  action$.pipe(
    filter(authSlice.actions.federatedIdentityProvided.match),
    tap((action) => deviceRepository.set("federatedIdentity", action.payload)),
    map(authSlice.actions.federedIdentityStoredInDevice),
  );

export const authEpics = [storeTokenInDevice];

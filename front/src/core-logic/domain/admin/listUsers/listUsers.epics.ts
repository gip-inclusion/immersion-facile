import { debounceTime, distinctUntilChanged, filter, map } from "rxjs";
import { switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { listUsersSlice } from "src/core-logic/domain/admin/listUsers/listUsers.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type ListUsersAction = ActionOfSlice<typeof listUsersSlice>;
type ListUserActionEpic = AppEpic<ListUsersAction>;

const fetchUsersEpic: ListUserActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(listUsersSlice.actions.fetchUsersRequested.match),
    switchMap((action) =>
      adminGateway.listUsers$(action.payload, getAdminToken(state$.value)),
    ),
    map((action) => {
      console.log("reached here : ", action);
      return listUsersSlice.actions.fetchUsersSucceeded(action);
    }),
  );

const triggerFetchOnQueryChangeEpic: ListUserActionEpic = (
  action$,
  _,
  { scheduler },
) =>
  action$.pipe(
    filter(listUsersSlice.actions.queryUpdated.match),
    debounceTime(400, scheduler),
    distinctUntilChanged(),
    map((action) =>
      listUsersSlice.actions.fetchUsersRequested({
        emailContains: action.payload,
      }),
    ),
  );

export const listUsersEpics = [fetchUsersEpic, triggerFetchOnQueryChangeEpic];

import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type FetchUserAction = ActionOfSlice<typeof fetchUserSlice>;
type FetchUserEpic = AppEpic<FetchUserAction>;

const fetchUserEpic: FetchUserEpic = (action$, state$, { adminGateway }) =>
  action$.pipe(
    filter(fetchUserSlice.actions.fetchUserRequested.match),
    switchMap((action) =>
      adminGateway.getIcUser$(
        { userId: action.payload.userId },
        getAdminToken(state$.value),
      ),
    ),
    map(fetchUserSlice.actions.fetchUserSucceeded),
  );

export const fetchUserEpics = [fetchUserEpic];

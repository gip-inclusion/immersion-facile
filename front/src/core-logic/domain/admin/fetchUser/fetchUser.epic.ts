import { filter, map, switchMap } from "rxjs";
import { fetchUserSlice } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { getConnectedUserJwt } from "../admin.helpers";

type FetchUserAction = ActionOfSlice<typeof fetchUserSlice>;
type FetchUserEpic = AppEpic<FetchUserAction>;

const fetchUserEpic: FetchUserEpic = (action$, state$, { authGateway }) =>
  action$.pipe(
    filter(fetchUserSlice.actions.fetchUserRequested.match),
    switchMap((action) =>
      adminGateway.getIcUser$(
        { userId: action.payload.userId },
        getConnectedUserJwt(state$.value),
      ),
    ),
    map(fetchUserSlice.actions.fetchUserSucceeded),
  );

export const fetchUserEpics = [fetchUserEpic];

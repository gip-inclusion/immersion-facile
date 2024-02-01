import { filter, map } from "rxjs";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type RootAppEpic = AppEpic<ActionOfSlice<typeof rootAppSlice>>;

const resetAppStateEpic: RootAppEpic = (action$, _state$) =>
  action$.pipe(
    filter(rootAppSlice.actions.appResetRequested.match),
    map(rootAppSlice.actions.appIsReady),
  );

export const rootAppEpics: RootAppEpic[] = [resetAppStateEpic];

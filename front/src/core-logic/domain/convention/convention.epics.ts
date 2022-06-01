import { filter, switchMap, map, catchError, of } from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { conventionSlice } from "./convention.slice";

type ConventionAction = ActionOfSlice<typeof conventionSlice>;

const getConventionEpic: AppEpic<ConventionAction> = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.conventionRequested.match),
    switchMap(({ payload }) => conventionGateway.retreiveFromToken(payload)),
    map(conventionSlice.actions.conventionSucceeded),
    catchError((error: Error) =>
      of(conventionSlice.actions.conventionFailed(error.message)),
    ),
  );

export const conventionEpics = [getConventionEpic];

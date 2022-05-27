import { filter, switchMap, map, catchError, of } from "rxjs";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { immersionConventionSlice } from "./immersionConvention.slice";

type ConventionAction = ActionOfSlice<typeof immersionConventionSlice>;

const getImmersionConventionEpic: AppEpic<ConventionAction> = (
  action$,
  _state$,
  { immersionApplicationGateway },
) =>
  action$.pipe(
    filter(immersionConventionSlice.actions.immersionConventionRequested.match),
    switchMap(({ payload }) =>
      immersionApplicationGateway.retreiveFromToken(payload),
    ),
    map(immersionConventionSlice.actions.immersionConventionSucceeded),
    catchError((error: Error) =>
      of(
        immersionConventionSlice.actions.immersionConventionFailed(
          error.message,
        ),
      ),
    ),
  );

export const immersionConventionEpics = [getImmersionConventionEpic];

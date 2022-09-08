import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { conventionSlice } from "./convention.slice";

type ConventionAction = ActionOfSlice<typeof conventionSlice>;

type ConventionEpic = AppEpic<ConventionAction>;

const getConventionEpic: ConventionEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
    filter(conventionSlice.actions.conventionRequested.match),
    switchMap(({ payload }) => conventionGateway.retrieveFromToken(payload)),
    map(conventionSlice.actions.conventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.conventionFailed(error.message),
    ),    filter(conventionSlice.actions.conventionRequested.match),
    switchMap(({ payload }) => conventionGateway.retrieveFromToken(payload)),
    map(conventionSlice.actions.conventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.conventionFailed(error.message),
    ),
  );

export const conventionEpics = [getConventionEpic];

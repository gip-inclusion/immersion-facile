import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { conventionSlice } from "./convention.slice";

type ConventionAction = ActionOfSlice<typeof conventionSlice>;

type ConventionEpic = AppEpic<ConventionAction>;

const saveConventionEpic: ConventionEpic = (
  action$,
  state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.saveConventionRequested.match),
    switchMap(({ payload }) => {
      const { jwt } = state$.value.convention;
      if (jwt) return conventionGateway.update$(payload, jwt);
      return conventionGateway.add$(payload);
    }),
    map(conventionSlice.actions.saveConventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.saveConventionFailed(error.message),
    ),
  );

const getConventionEpic: ConventionEpic = (
  action$,
  _state$,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.conventionRequested.match),
    switchMap(({ payload }) => conventionGateway.retrieveFromToken$(payload)),
    map(conventionSlice.actions.conventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.conventionFailed(error.message),
    ),
  );

const signConventionEpic: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.signConventionRequested.match),
    switchMap(({ payload }) => conventionGateway.signConvention$(payload)),
    map(conventionSlice.actions.signConventionSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.signConventionFailed(error.message),
    ),
  );

const conventionStatusChangeEpic: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.statusChangeRequested.match),
    switchMap(({ payload }) =>
      conventionGateway
        .updateStatus$(
          {
            status: payload.newStatus,
            justification: payload.justification,
          },
          payload.jwt,
        )
        .pipe(
          map(() =>
            conventionSlice.actions.statusChangeSucceeded(payload.feedbackKind),
          ),
        ),
    ),
    // map(conventionSlice.actions.statusChangeSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.statusChangeFailed(error.message),
    ),
  );

export const conventionEpics = [
  saveConventionEpic,
  getConventionEpic,
  signConventionEpic,
  conventionStatusChangeEpic,
];

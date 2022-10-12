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

const askModificationConventionEpic: ConventionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(conventionSlice.actions.modificationRequested.match),
    switchMap(({ payload }) =>
      conventionGateway.updateStatus$(
        {
          status: "DRAFT",
          justification: payload.justification,
        },
        payload.jwt,
      ),
    ),
    map(conventionSlice.actions.modificationSucceeded),
    catchEpicError((error: Error) =>
      conventionSlice.actions.modificationFailed(error.message),
    ),
  );

export const conventionEpics = [
  saveConventionEpic,
  getConventionEpic,
  signConventionEpic,
  askModificationConventionEpic,
];

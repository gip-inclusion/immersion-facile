import { filter, map, switchMap } from "rxjs";

import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import { immersionAssessmentSlice } from "./immersionAssessment.slice";

type ImmersionAssessmentAction = ActionOfSlice<typeof immersionAssessmentSlice>;

const createAssessmentEpic: AppEpic<ImmersionAssessmentAction> = (
  action$,
  _,
  { immersionAssessmentGateway },
) =>
  action$.pipe(
    filter(immersionAssessmentSlice.actions.creationRequested.match),
    switchMap((action) =>
      immersionAssessmentGateway.createAssessment(action.payload),
    ),
    map((_result) => immersionAssessmentSlice.actions.creationSucceeded()),
    catchEpicError((error) =>
      immersionAssessmentSlice.actions.creationFailed(error.message),
    ),
  );

export const immersionAssessmentEpics = [createAssessmentEpic];

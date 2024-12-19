import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { assessmentSlice } from "./assessment.slice";

type AssessmentAction = ActionOfSlice<typeof assessmentSlice>;

const createAssessmentEpic: AppEpic<AssessmentAction> = (
  action$,
  _,
  { assessmentGateway },
) =>
  action$.pipe(
    filter(assessmentSlice.actions.creationRequested.match),
    switchMap((action) =>
      assessmentGateway.createAssessment$(action.payload.assessmentAndJwt).pipe(
        map((_result) =>
          assessmentSlice.actions.creationSucceeded({
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
        catchEpicError((error) =>
          assessmentSlice.actions.creationFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      ),
    ),
  );

export const assessmentEpics = [createAssessmentEpic];

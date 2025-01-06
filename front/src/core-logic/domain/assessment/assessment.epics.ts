import { filter, map, switchMap } from "rxjs";
import { errors } from "shared";
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

const getAssessmentEpic: AppEpic<AssessmentAction> = (
  action$,
  _,
  { assessmentGateway },
) =>
  action$.pipe(
    filter(assessmentSlice.actions.getAssessmentRequested.match),
    switchMap((action) =>
      assessmentGateway.getAssessment$(action.payload).pipe(
        map((result) => assessmentSlice.actions.getAssessmentSucceeded(result)),
        catchEpicError((error) => {
          if (
            error.message ===
            errors.assessment.notFound(action.payload.conventionId).message
          ) {
            return assessmentSlice.actions.noAssessmentForConventionFound();
          }
          return assessmentSlice.actions.getAssessmentFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          });
        }),
      ),
    ),
  );

export const assessmentEpics = [createAssessmentEpic, getAssessmentEpic];

import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { sendAssessmentLinkSlice } from "src/core-logic/domain/assessment/send-assessment-link/sendAssessmentLink.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type SendAssessmentLinkAction = ActionOfSlice<
  typeof sendAssessmentLinkSlice
>;

type SendAssessmentLinkEpic = AppEpic<
  SendAssessmentLinkAction | { type: "do-nothing" }
>;

const sendAssessmentLinkEpic: SendAssessmentLinkEpic = (
  action$,
  _,
  { assessmentGateway },
) =>
  action$.pipe(
    filter(sendAssessmentLinkSlice.actions.sendAssessmentLinkRequested.match),
    switchMap((action) =>
      assessmentGateway
        .sendAssessmentLink$(action.payload, action.payload.jwt)
        .pipe(
          map(() =>
            sendAssessmentLinkSlice.actions.sendAssessmentLinkSucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            sendAssessmentLinkSlice.actions.sendAssessmentLinkFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const sendAssessmentLinkEpics = [sendAssessmentLinkEpic];

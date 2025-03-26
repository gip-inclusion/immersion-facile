import type { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { type Observable, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import type {
  PayloadActionWithFeedbackTopicError,
  PayloadWithFeedbackTopic,
} from "src/core-logic/domain/feedback/feedback.slice";
import type { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import {
  type StatusChangePayload,
  conventionActionSlice,
} from "./conventionAction.slice";

const makeConventionStatusChangeEpic =
  ({
    requestAction,
    successAction,
    failedAction,
    onError,
  }: {
    requestAction: ConventionStatusChangeAction;
    successAction: ConventionStatusChangeAction;
    failedAction: ConventionStatusChangeFailedAction;
    onError?: (
      error: Error,
      payload: StatusChangePayload & PayloadWithFeedbackTopic,
    ) =>
      | ReturnType<ConventionStatusChangeAction>
      | ReturnType<ConventionStatusChangeFailedAction>;
  }): ConventionActionEpic =>
  (
    action$: Observable<ConventionAction>,
    _,
    { conventionGateway }: { conventionGateway: ConventionGateway },
  ) =>
    action$.pipe(
      filter(requestAction.match),
      switchMap(({ payload }) =>
        conventionGateway
          .updateConventionStatus$(payload.updateStatusParams, payload.jwt)
          .pipe(
            map(() => successAction(payload)),
            catchEpicError((error: Error) => {
              if (onError) {
                return onError(error, payload);
              }
              return failedAction({
                errorMessage: error.message,
                feedbackTopic: payload.feedbackTopic,
              });
            }),
          ),
      ),
    );

export type ConventionAction = ActionOfSlice<typeof conventionActionSlice>;

type ConventionActionEpic = AppEpic<ConventionAction>;

const transferConventionToAgencyEpic: ConventionActionEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      conventionActionSlice.actions.transferConventionToAgencyRequested.match,
    ),
    switchMap((action) =>
      conventionGateway
        .transferConventionToAgency$(
          action.payload.transferConventionToAgencyParams,
          action.payload.jwt,
        )
        .pipe(
          map(() =>
            conventionActionSlice.actions.transferConventionToAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            conventionActionSlice.actions.transferConventionToAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const cancelConventionEpic = makeConventionStatusChangeEpic({
  requestAction: conventionActionSlice.actions.cancelConventionRequested,
  successAction: conventionActionSlice.actions.cancelConventionSucceeded,
  failedAction: conventionActionSlice.actions.cancelConventionFailed,
});

const deprecateConventionEpic = makeConventionStatusChangeEpic({
  requestAction: conventionActionSlice.actions.deprecateConventionRequested,
  successAction: conventionActionSlice.actions.deprecateConventionSucceeded,
  failedAction: conventionActionSlice.actions.deprecateConventionFailed,
});

const rejectConventionEpic = makeConventionStatusChangeEpic({
  requestAction: conventionActionSlice.actions.rejectConventionRequested,
  successAction: conventionActionSlice.actions.rejectConventionSucceeded,
  failedAction: conventionActionSlice.actions.rejectConventionFailed,
});

const editConventionEpic = makeConventionStatusChangeEpic({
  requestAction: conventionActionSlice.actions.editConventionRequested,
  successAction: conventionActionSlice.actions.editConventionSucceeded,
  failedAction: conventionActionSlice.actions.editConventionFailed,
});

const acceptByValidatorEpic = makeConventionStatusChangeEpic({
  requestAction: conventionActionSlice.actions.acceptByValidatorRequested,
  successAction: conventionActionSlice.actions.acceptByValidatorSucceeded,
  failedAction: conventionActionSlice.actions.acceptByValidatorFailed,
  onError: (error, payload) => {
    if (error.message.includes("Convention should be reviewed by counsellor")) {
      return conventionActionSlice.actions.acceptByCounsellorRequested(payload);
    }
    return conventionActionSlice.actions.acceptByValidatorFailed({
      errorMessage: error.message,
      feedbackTopic: payload.feedbackTopic,
    });
  },
});

const acceptByCounsellorEpic = makeConventionStatusChangeEpic({
  requestAction: conventionActionSlice.actions.acceptByCounsellorRequested,
  successAction: conventionActionSlice.actions.acceptByCounsellorSucceeded,
  failedAction: conventionActionSlice.actions.acceptByCounsellorFailed,
});

// const conventionStatusChangeEpic: ConventionActionEpic = (
//   action$,
//   _,
//   { conventionGateway },
// ) =>
//   action$.pipe(
//     filter(
//       conventionActionSlice.actions.acceptByCounsellorRequested.match ||
//         conventionActionSlice.actions.acceptByValidatorRequested.match ||
//         conventionActionSlice.actions.cancelConventionRequested.match ||
//         conventionActionSlice.actions.deprecateConventionRequested.match ||
//         conventionActionSlice.actions.rejectConventionRequested.match ||
//         conventionActionSlice.actions.editConventionRequested.match,
//     ),
//     switchMap(({ payload, type }) =>
//       conventionGateway
//         .updateConventionStatus$(payload.updateStatusParams, payload.jwt)
//         .pipe(
//           map(() => {
//             const successAction = successActionMap[type];
//             if (!successAction) throw new Error("Unknown action type");
//             return successAction(payload);
//           }),
//           catchEpicError((error: Error) => {
//             if (
//               error.message.includes(
//                 "Convention should be reviewed by counsellor",
//               )
//             )
//               return conventionActionSlice.actions.acceptByCounsellorSucceeded(
//                 payload,
//               );

//             const failedAction = failedActionMap[type];
//             if (!failedAction) throw new Error("Unknown action type");
//             return failedAction({
//               errorMessage: error.message,
//               feedbackTopic: payload.feedbackTopic,
//             });
//           }),
//         ),
//     ),
//   );

export const conventionActionEpics = [
  transferConventionToAgencyEpic,
  cancelConventionEpic,
  deprecateConventionEpic,
  rejectConventionEpic,
  editConventionEpic,
  acceptByValidatorEpic,
  acceptByCounsellorEpic,
];

type ConventionStatusChangeAction = ActionCreatorWithPayload<
  StatusChangePayload & PayloadWithFeedbackTopic,
  string
>;

type ConventionStatusChangeFailedAction = ActionCreatorWithPayload<
  PayloadActionWithFeedbackTopicError["payload"],
  string
>;

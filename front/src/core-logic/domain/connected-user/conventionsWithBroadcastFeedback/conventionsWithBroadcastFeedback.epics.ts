import { filter, map, switchMap } from "rxjs";
import { conventionsWithBroadcastFeedbackSlice } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type ConnectedUserConventionsWithBroadcastFeedbackAction = ActionOfSlice<
  typeof conventionsWithBroadcastFeedbackSlice
>;
type ConnectedUserConventionsWithBroadcastFeedbackEpic =
  AppEpic<ConnectedUserConventionsWithBroadcastFeedbackAction>;

const getConventionsWithErroredBroadcastFeedbackEpic: ConnectedUserConventionsWithBroadcastFeedbackEpic =
  (actions$, _, { conventionGateway }) =>
    actions$.pipe(
      filter(
        conventionsWithBroadcastFeedbackSlice.actions
          .getConventionsWithErroredBroadcastFeedbackRequested.match,
      ),
      switchMap((action) =>
        conventionGateway
          .getConventionsWithErroredBroadcastFeedback$(
            action.payload.params,
            action.payload.jwt,
          )
          .pipe(
            map((response) =>
              conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackSucceeded(
                {
                  ...response,
                  feedbackTopic: action.payload.feedbackTopic,
                },
              ),
            ),
            catchEpicError((error) =>
              conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackFailed(
                {
                  errorMessage: error.message,
                  feedbackTopic: action.payload.feedbackTopic,
                },
              ),
            ),
          ),
      ),
    );

export const conventionsWithBroadcastFeedbackEpics = [
  getConventionsWithErroredBroadcastFeedbackEpic,
];

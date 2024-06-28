import { filter, map, switchMap } from "rxjs";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { discussionSlice } from "./discussion.slice";

type DiscussionAction = ActionOfSlice<typeof discussionSlice>;
type DiscussionEpic = AppEpic<DiscussionAction>;

const fetchDiscussionByIdEpic: DiscussionEpic = (
  action$,
  _state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(discussionSlice.actions.fetchDiscussionRequested.match),
    switchMap((action) =>
      inclusionConnectedGateway.getDiscussionById$(action.payload).pipe(
        map((discussion) =>
          discussionSlice.actions.fetchDiscussionSucceeded({
            discussion,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
        catchEpicError((error) =>
          discussionSlice.actions.fetchDiscussionFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      ),
    ),
  );

export const discussionEpics = [fetchDiscussionByIdEpic];

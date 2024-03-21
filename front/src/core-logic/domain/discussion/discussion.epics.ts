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
    switchMap(({ payload }) =>
      inclusionConnectedGateway.getDiscussionById$(payload),
    ),
    map(discussionSlice.actions.fetchDiscussionSucceeded),
    catchEpicError((error) =>
      discussionSlice.actions.fetchDiscussionFailed(error.message),
    ),
  );

export const discussionEpics = [fetchDiscussionByIdEpic];

import { filter, map, switchMap } from "rxjs";
import { discussionExchangeForbidenContents } from "shared";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
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

const updateDiscussionStatusEpic: DiscussionEpic = (
  action$,
  _state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(discussionSlice.actions.updateDiscussionStatusRequested.match),
    switchMap((action) =>
      inclusionConnectedGateway.updateDiscussionStatus$(action.payload).pipe(
        map(() =>
          discussionSlice.actions.updateDiscussionStatusSucceeded({
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
        catchEpicError((error) =>
          discussionSlice.actions.updateDiscussionStatusFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      ),
    ),
  );

const sendMessageEpic: DiscussionEpic = (
  action$,
  _state$,
  { inclusionConnectedGateway },
) =>
  action$.pipe(
    filter(discussionSlice.actions.sendExchangeRequested.match),
    switchMap((action) =>
      inclusionConnectedGateway.sendMessage$(action.payload.exchangeData).pipe(
        map((result) =>
          "reason" in result
            ? discussionSlice.actions.sendExchangeFailed({
                errorMessage:
                  discussionExchangeForbidenContents[result.sender][
                    result.reason
                  ],
                feedbackTopic: action.payload.feedbackTopic,
              })
            : discussionSlice.actions.sendExchangeSucceeded({
                exchangeData: result,
                feedbackTopic: action.payload.feedbackTopic,
              }),
        ),
        catchEpicError((error) =>
          discussionSlice.actions.sendExchangeFailed({
            errorMessage: error.message,
            feedbackTopic: action.payload.feedbackTopic,
          }),
        ),
      ),
    ),
  );

export const discussionEpics = [
  fetchDiscussionByIdEpic,
  updateDiscussionStatusEpic,
  sendMessageEpic,
];

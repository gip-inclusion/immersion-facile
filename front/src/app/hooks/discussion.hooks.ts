import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { ConnectedUserJwt, DiscussionId, ExchangeRole } from "shared";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { useAppSelector } from "./reduxHooks";

export const useDiscussion = (
  discussionId: DiscussionId,
  viewer: ExchangeRole,
  connectedUserJwt?: ConnectedUserJwt,
) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (connectedUserJwt)
      dispatch(
        discussionSlice.actions.fetchDiscussionRequested({
          discussionId,
          jwt: connectedUserJwt,
          feedbackTopic: "dashboard-discussion",
          viewer,
        }),
      );
  }, [dispatch, discussionId, connectedUserJwt, viewer]);

  const discussion = useAppSelector(discussionSelectors.discussion);
  const isLoading = useAppSelector(discussionSelectors.isLoading);

  return { discussion, isLoading };
};

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { ConnectedUserJwt, DiscussionId } from "shared";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { useAppSelector } from "./reduxHooks";

export const useDiscussion = (
  discussionId: DiscussionId,
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
        }),
      );
  }, [dispatch, discussionId, connectedUserJwt]);

  const discussion = useAppSelector(discussionSelectors.discussion);
  const fetchError = useAppSelector(discussionSelectors.fetchError);
  const isLoading = useAppSelector(discussionSelectors.isLoading);

  return { discussion, fetchError, isLoading };
};

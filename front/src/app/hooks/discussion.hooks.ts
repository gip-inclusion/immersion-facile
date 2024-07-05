import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DiscussionId, InclusionConnectJwt } from "shared";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { useAppSelector } from "./reduxHooks";

export const useDiscussion = (
  discussionId: DiscussionId,
  inclusionConnectedJwt?: InclusionConnectJwt,
) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (inclusionConnectedJwt)
      dispatch(
        discussionSlice.actions.fetchDiscussionRequested({
          discussionId,
          jwt: inclusionConnectedJwt,
          feedbackTopic: "dashboard-discussion",
        }),
      );
  }, [dispatch, discussionId, inclusionConnectedJwt]);

  const discussion = useAppSelector(discussionSelectors.discussion);
  const fetchError = useAppSelector(discussionSelectors.fetchError);
  const isLoading = useAppSelector(discussionSelectors.isLoading);

  return { discussion, fetchError, isLoading };
};

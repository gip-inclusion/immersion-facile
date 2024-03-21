import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DiscussionId } from "shared";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { useAppSelector } from "./reduxHooks";

export const useDiscussion = (discussionId: DiscussionId) => {
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );

  const dispatch = useDispatch();
  useEffect(() => {
    if (inclusionConnectedJwt)
      dispatch(
        discussionSlice.actions.fetchDiscussionRequested({
          discussionId,
          jwt: inclusionConnectedJwt,
        }),
      );
  }, [dispatch, discussionId, inclusionConnectedJwt]);

  const discussion = useAppSelector(discussionSelectors.discussion);
  const fetchError = useAppSelector(discussionSelectors.fetchError);
  const isLoading = useAppSelector(discussionSelectors.isLoading);

  return { discussion, fetchError, isLoading };
};

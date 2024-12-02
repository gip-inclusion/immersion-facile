import { createSlice } from "@reduxjs/toolkit";
import {
  DiscussionId,
  DiscussionReadDto,
  DiscussionRejected,
  InclusionConnectJwt,
} from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export type FetchDiscussionRequestedPayload = {
  jwt: InclusionConnectJwt;
  discussionId: DiscussionId;
};

export type RejectDiscussionRequestedPayload = {
  jwt: InclusionConnectJwt;
  discussionId: DiscussionId;
} & DiscussionRejected;

export type DiscussionState = {
  discussion: DiscussionReadDto | null;
  isLoading: boolean;
};

const initialDiscussionState: DiscussionState = {
  discussion: null,
  isLoading: false,
};

export const discussionSlice = createSlice({
  name: "discussion",
  initialState: initialDiscussionState,
  reducers: {
    fetchDiscussionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<FetchDiscussionRequestedPayload>,
    ) => {
      state.isLoading = true;
      state.discussion = null;
    },
    fetchDiscussionSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        discussion: DiscussionReadDto | undefined;
      }>,
    ) => {
      state.discussion = action.payload.discussion ?? null;
      state.isLoading = false;
    },
    fetchDiscussionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
    updateDiscussionStatusRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<RejectDiscussionRequestedPayload>,
    ) => {
      state.isLoading = true;
    },
    updateDiscussionStatusSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    updateDiscussionStatusFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        errorMessage: string;
      }>,
    ) => {
      state.isLoading = false;
    },
  },
});

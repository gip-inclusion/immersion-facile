import { createSlice } from "@reduxjs/toolkit";
import type {
  ConnectedUserJwt,
  DiscussionId,
  DiscussionReadDto,
  DiscussionRejected,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type FetchDiscussionRequestedPayload = {
  jwt: ConnectedUserJwt;
  discussionId: DiscussionId;
};

export type RejectDiscussionRequestedPayload = {
  jwt: ConnectedUserJwt;
  discussionId: DiscussionId;
} & DiscussionRejected;

export type DiscussionState = {
  discussion: DiscussionReadDto | null;
  isLoading: boolean;
  fetchError: string | null;
};

export type SendMessageRequestedPayload = {
  jwt: ConnectedUserJwt;
  discussionId: DiscussionId;
  message: string;
};

const initialDiscussionState: DiscussionState = {
  discussion: null,
  isLoading: false,
  fetchError: null,
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
      _action: PayloadActionWithFeedbackTopicError,
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
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    sendMessageRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<SendMessageRequestedPayload>,
    ) => {
      state.isLoading = true;
    },
    sendMessageSucceeded: (state, _action: PayloadActionWithFeedbackTopic) => {
      state.isLoading = false;
    },
    sendMessageFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DiscussionId, DiscussionReadDto, InclusionConnectJwt } from "shared";

export type FetchDiscussionRequestedPayload = {
  jwt: InclusionConnectJwt;
  discussionId: DiscussionId;
};

export type DiscussionState = {
  discussion: DiscussionReadDto | null;
  isLoading: boolean;
  fetchError: string | null;
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
      _action: PayloadAction<FetchDiscussionRequestedPayload>,
    ) => {
      state.isLoading = true;
      state.discussion = null;
    },
    fetchDiscussionSucceeded: (
      state,
      action: PayloadAction<DiscussionReadDto | undefined>,
    ) => {
      state.discussion = action.payload ?? null;
      state.isLoading = false;
    },
    fetchDiscussionFailed: (state, action: PayloadAction<string>) => {
      state.fetchError = action.payload;
      state.isLoading = false;
    },
  },
});

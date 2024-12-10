import { createSlice } from "@reduxjs/toolkit";
import type { WithAgencyIdAndUserId } from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface RemoveUserFromAgencyState {
  isLoading: boolean;
}

export const removeUserFromAgencyInitialState: RemoveUserFromAgencyState = {
  isLoading: false,
};

export const removeUserFromAgencySlice = createSlice({
  name: "removeUserFromAgency",
  initialState: removeUserFromAgencyInitialState,
  reducers: {
    removeUserFromAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isLoading = true;
    },

    removeUserFromAgencySucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isLoading = false;
    },

    removeUserFromAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

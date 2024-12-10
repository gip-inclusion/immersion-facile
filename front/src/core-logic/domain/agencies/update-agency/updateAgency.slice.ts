import { createSlice } from "@reduxjs/toolkit";
import { AgencyDto } from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export type UpdateAgencyState = {
  isLoading: boolean;
};

export const updateAgencyInitialState: UpdateAgencyState = {
  isLoading: false,
};

export const updateAgencySlice = createSlice({
  name: "updateAgency",
  initialState: updateAgencyInitialState,
  reducers: {
    updateAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<AgencyDto>,
    ) => {
      state.isLoading = true;
    },
    updateAgencySucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<AgencyDto>,
    ) => {
      state.isLoading = false;
    },
    updateAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

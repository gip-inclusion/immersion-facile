import { createSlice } from "@reduxjs/toolkit";
import { ConventionSupportedJwt, RemindSignatoriesRequestDto } from "shared";

import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface RemindSignatoriesState {
  isLoading: boolean;
}

export const remindSignatoriesInitialState: RemindSignatoriesState = {
  isLoading: false,
};

export const remindSignatoriesSlice = createSlice({
  name: "remindSignatories",
  initialState: remindSignatoriesInitialState,
  reducers: {
    remindSignatoriesRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        RemindSignatoriesRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isLoading = true;
    },

    remindSignatoriesSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        RemindSignatoriesRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isLoading = false;
    },

    remindSignatoriesFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

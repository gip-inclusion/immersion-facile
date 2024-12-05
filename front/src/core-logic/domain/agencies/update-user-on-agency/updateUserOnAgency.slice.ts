import { createSlice } from "@reduxjs/toolkit";
import { InclusionConnectJwt, UserParamsForAgency } from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

type UpdateUserOnAgencyState = {
  isLoading: boolean;
};

export const updateUserOnAgencyInitialState: UpdateUserOnAgencyState = {
  isLoading: false,
};

export const updateUserOnAgencySlice = createSlice({
  name: "updateUserOnAgency",
  initialState: updateUserOnAgencyInitialState,
  reducers: {
    updateUserAgencyRightRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        user: UserParamsForAgency;
        jwt: InclusionConnectJwt;
      }>,
    ) => {
      state.isLoading = true;
    },
    updateUserAgencyRightSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isLoading = false;
    },
    updateUserAgencyRightFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

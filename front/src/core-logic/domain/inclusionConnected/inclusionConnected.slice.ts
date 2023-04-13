import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AbsoluteUrl } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type InclusionConnectedFeedback = SubmitFeedBack<"success">;

type InclusionConnectedState = {
  dashboardUrl: AbsoluteUrl | null;
  isLoading: boolean;
  feedback: InclusionConnectedFeedback;
};

const initialState: InclusionConnectedState = {
  dashboardUrl: null,
  isLoading: false,
  feedback: { kind: "idle" },
};

export const inclusionConnectedSlice = createSlice({
  name: "inclusionConnected",
  initialState,
  reducers: {
    agencyDashboardUrlFetchRequested: (state) => {
      state.isLoading = true;
    },
    agencyDashboardUrlFetchSucceeded: (
      state,
      action: PayloadAction<AbsoluteUrl>,
    ) => {
      state.isLoading = false;
      state.dashboardUrl = action.payload;
      state.feedback = { kind: "success" };
    },
    agencyDashboardUrlFetchFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});

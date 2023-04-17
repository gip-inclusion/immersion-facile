import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InclusionConnectedUser, WithAgencyIds } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type InclusionConnectedFeedback = SubmitFeedBack<"success">;

type InclusionConnectedState = {
  currentUser: InclusionConnectedUser | null;
  isLoading: boolean;
  feedback: InclusionConnectedFeedback;
};

const initialState: InclusionConnectedState = {
  currentUser: null,
  isLoading: false,
  feedback: { kind: "idle" },
};

export const inclusionConnectedSlice = createSlice({
  name: "inclusionConnected",
  initialState,
  reducers: {
    currentUserFetchRequested: (state) => {
      state.isLoading = true;
    },
    currentUserFetchSucceeded: (
      state,
      action: PayloadAction<InclusionConnectedUser>,
    ) => {
      state.isLoading = false;
      state.currentUser = action.payload;
      state.feedback = { kind: "success" };
    },
    currentUserFetchFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    registerAgenciesRequested: (
      state,
      _payload: PayloadAction<WithAgencyIds>,
    ) => {
      state.isLoading = true;
    },
    registerAgenciesSucceeded: (
      state,
      action: PayloadAction<InclusionConnectedUser>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "success" };
      state.currentUser = action.payload;
    },
    registerAgenciesFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});

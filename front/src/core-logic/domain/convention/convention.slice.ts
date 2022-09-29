import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConventionReadDto } from "shared";

export type ConventionSuccessFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAsked";

export type ConventionSubmitFeedback =
  | ConventionSuccessFeedbackKind
  | Error
  | null;

export interface ConventionState {
  isLoading: boolean;
  convention: ConventionReadDto | null;
  error: string | null;
  feedback: ConventionSubmitFeedback;
}

const initialState: ConventionState = {
  convention: null,
  isLoading: false,
  error: null,
  feedback: null,
};

export const conventionSlice = createSlice({
  name: "convention",
  initialState,
  reducers: {
    conventionRequested: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
    },
    conventionSucceeded: (
      state,
      action: PayloadAction<ConventionReadDto | undefined>,
    ) => {
      state.convention = action.payload ?? null;
      state.isLoading = false;
    },
    conventionFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    conventionSubmitFeedbackChanged: (
      state,
      action: PayloadAction<ConventionSubmitFeedback>,
    ) => {
      state.feedback = action.payload;
    },
  },
});

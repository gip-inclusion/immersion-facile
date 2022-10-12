import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConventionReadDto, SignatoryRole } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type ConventionSuccessFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAsked";

export type ConventionSubmitFeedback =
  SubmitFeedBack<ConventionSuccessFeedbackKind>;

export interface ConventionState {
  isLoading: boolean;
  convention: ConventionReadDto | null;
  error: string | null;
  feedback: ConventionSubmitFeedback;
  currentSignatoryRole: SignatoryRole | null;
}

const initialState: ConventionState = {
  convention: null,
  isLoading: false,
  error: null,
  feedback: { kind: "idle" },
  currentSignatoryRole: null,
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

    signConventionRequested: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
    },
    signConventionSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "signedSuccessfully" };
    },
    signConventionFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    modificationRequested: (
      state,
      _action: PayloadAction<{ justification: string; jwt: string }>,
    ) => {
      state.isLoading = true;
    },
    modificationSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "modificationsAsked" };
    },
    modificationFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    conventionSubmitFeedbackChanged: (
      state,
      action: PayloadAction<ConventionSubmitFeedback>,
    ) => {
      state.feedback = action.payload;
    },

    currentSignatoryRoleChanged: (
      state,
      action: PayloadAction<SignatoryRole | null>,
    ) => {
      state.currentSignatoryRole = action.payload;
    },
  },
});

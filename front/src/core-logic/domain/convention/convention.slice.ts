import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConventionDto, ConventionReadDto, SignatoryRole } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type ConventionSuccessFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAsked";

export type ConventionSubmitFeedback =
  SubmitFeedBack<ConventionSuccessFeedbackKind>;

export interface ConventionState {
  jwt: string | null;
  isLoading: boolean;
  convention: ConventionReadDto | null;
  error: string | null;
  feedback: ConventionSubmitFeedback;
  currentSignatoryRole: SignatoryRole | null;
}

const initialState: ConventionState = {
  jwt: null,
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
    // Save convention
    saveConventionRequested: (state, _action: PayloadAction<ConventionDto>) => {
      state.isLoading = true;
    },
    saveConventionSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "justSubmitted" };
    },
    saveConventionFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    // Get convention from token
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

    // Sign convention
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

    // Modification requested
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

    jwtProvided: (state, action: PayloadAction<string>) => {
      state.jwt = action.payload;
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

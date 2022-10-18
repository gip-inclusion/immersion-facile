import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ConventionDto,
  ConventionReadDto,
  ConventionStatus,
  SignatoryRole,
} from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

type ConventionValidationFeedbackKind =
  | "rejected"
  | "modificationAskedFromCounsellorOrValidator"
  | "markedAsEligible"
  | "markedAsValidated";

type ConventionSignatoryFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAskedFromSignatory";

export type ConventionFeedbackKind =
  | ConventionSignatoryFeedbackKind
  | ConventionValidationFeedbackKind;

export type ConventionSubmitFeedback = SubmitFeedBack<ConventionFeedbackKind>;

export interface ConventionState {
  formUi: { isMinor: boolean; isTutorEstablishmentRepresentative: boolean };
  jwt: string | null;
  isLoading: boolean;
  convention: ConventionReadDto | null;
  fetchError: string | null;
  feedback: ConventionSubmitFeedback;
  currentSignatoryRole: SignatoryRole | null;
}

const initialState: ConventionState = {
  formUi: { isMinor: false, isTutorEstablishmentRepresentative: true },
  jwt: null,
  convention: null,
  isLoading: false,
  fetchError: null,
  feedback: { kind: "idle" },
  currentSignatoryRole: null,
};

type StatusChangePayload = {
  newStatus: ConventionStatus;
  feedbackKind: ConventionFeedbackKind;
  jwt: string;
  justification?: string;
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
    fetchConventionRequested: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
      state.feedback = { kind: "idle" };
    },
    fetchConventionSucceeded: (
      state,
      action: PayloadAction<ConventionReadDto | undefined>,
    ) => {
      state.convention = action.payload ?? null;
      state.isLoading = false;
    },
    fetchConventionFailed: (state, action: PayloadAction<string>) => {
      state.fetchError = action.payload;
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
    statusChangeRequested: (
      state,
      _action: PayloadAction<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },
    statusChangeSucceeded: (
      state,
      action: PayloadAction<ConventionFeedbackKind>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: action.payload };
    },
    statusChangeFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    isMinorChanged: (state, action: PayloadAction<boolean>) => {
      state.formUi.isMinor = action.payload;
    },

    isTutorEstablishmentRepresentativeChanged: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.formUi.isTutorEstablishmentRepresentative = action.payload;
    },

    clearFeedbackTriggered: (state) => {
      state.feedback = { kind: "idle" };
    },

    jwtProvided: (state, action: PayloadAction<string>) => {
      state.jwt = action.payload;
    },

    currentSignatoryRoleChanged: (
      state,
      action: PayloadAction<SignatoryRole | null>,
    ) => {
      state.currentSignatoryRole = action.payload;
    },
  },
});

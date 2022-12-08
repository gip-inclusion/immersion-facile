import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AbsoluteUrl,
  ConventionDto,
  ConventionReadDto,
  Signatories,
  SignatoryRole,
  UpdateConventionStatusRequestDto,
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
  formUi: {
    isMinor: boolean;
    isTutorEstablishmentRepresentative: boolean;
    hasCurrentEmployer: boolean;
  };
  jwt: string | null;
  isLoading: boolean;
  convention: ConventionReadDto | null;
  conventionStatusDashboardUrl: AbsoluteUrl | null;
  fetchError: string | null;
  feedback: ConventionSubmitFeedback;
  currentSignatoryRole: SignatoryRole | null;
}

const initialState: ConventionState = {
  formUi: {
    isMinor: false,
    isTutorEstablishmentRepresentative: true,
    hasCurrentEmployer: false,
  },
  jwt: null,
  convention: null,
  conventionStatusDashboardUrl: null,
  isLoading: false,
  fetchError: null,
  feedback: { kind: "idle" },
  currentSignatoryRole: null,
};

type StatusChangePayload = {
  feedbackKind: ConventionFeedbackKind;
  jwt: string;
  updateStatusParams: UpdateConventionStatusRequestDto;
};

type Jwt = string;
type DateIsoStr = string;

const setFeedbackAsErrored = (
  state: ConventionState,
  action: PayloadAction<string>,
) => {
  state.isLoading = false;
  state.feedback = { kind: "errored", errorMessage: action.payload };
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
    saveConventionFailed: setFeedbackAsErrored,

    // Get convention from token
    fetchConventionRequested: (state, _action: PayloadAction<Jwt>) => {
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
    signConventionRequested: (
      state,
      _action: PayloadAction<{
        jwt: Jwt;
        role: SignatoryRole;
        signedAt: DateIsoStr;
      }>,
    ) => {
      state.isLoading = true;
    },
    signConventionSucceeded: (
      state,
      action: PayloadAction<{ role: SignatoryRole; signedAt: DateIsoStr }>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "signedSuccessfully" };
      if (state.convention) {
        const signatoryKey = signatoryRoleToKey[action.payload.role];
        const signatory = state.convention.signatories[signatoryKey];
        if (signatory) {
          signatory.signedAt = action.payload.signedAt;
        }
      }
    },
    signConventionFailed: setFeedbackAsErrored,

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
    statusChangeFailed: setFeedbackAsErrored,

    // get convention status dashboard
    conventionStatusDashboardRequested: (
      state,
      _action: PayloadAction<Jwt>,
    ) => {
      state.isLoading = true;
    },
    conventionStatusDashboardSucceeded: (
      state,
      action: PayloadAction<AbsoluteUrl>,
    ) => {
      state.isLoading = false;
      state.conventionStatusDashboardUrl = action.payload;
    },
    conventionStatusDashboardFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    isMinorChanged: (state, action: PayloadAction<boolean>) => {
      state.formUi.isMinor = action.payload;
    },
    isCurrentEmployerChanged: (state, action: PayloadAction<boolean>) => {
      state.formUi.hasCurrentEmployer = action.payload;
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

    clearFetchedConvention: (state) => {
      state.convention = null;
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

const signatoryRoleToKey: Record<SignatoryRole, keyof Signatories> = {
  "establishment-representative": "establishmentRepresentative",
  beneficiary: "beneficiary",
  "beneficiary-current-employer": "beneficiaryCurrentEmployer",
  establishment: "establishmentRepresentative",
  "legal-representative": "beneficiaryRepresentative",
  "beneficiary-representative": "beneficiaryRepresentative",
};

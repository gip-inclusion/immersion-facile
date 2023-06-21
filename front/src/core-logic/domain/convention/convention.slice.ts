import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AbsoluteUrl,
  AgencyId,
  BackOfficeJwt,
  ConventionId,
  ConventionMagicLinkJwt,
  ConventionReadDto,
  SignatoryRole,
  UpdateConventionStatusRequestDto,
} from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

type ConventionValidationFeedbackKind =
  | "rejected"
  | "modificationAskedFromCounsellorOrValidator"
  | "markedAsEligible"
  | "markedAsValidated"
  | "cancelled"
  | "deprecated";

type ConventionSignatoryFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAskedFromSignatory";

export type ConventionFeedbackKind =
  | ConventionSignatoryFeedbackKind
  | ConventionValidationFeedbackKind;

export type ConventionSubmitFeedback = SubmitFeedBack<ConventionFeedbackKind>;

export type NumberOfSteps = 1 | 2 | 3 | 4 | 5;

export interface ConventionState {
  formUi: {
    preselectedAgencyId: AgencyId | null;
    isMinor: boolean;
    isTutorEstablishmentRepresentative: boolean;
    hasCurrentEmployer: boolean;
    currentStep: NumberOfSteps;
    showSummary: boolean;
    agencyDepartment: string | null;
  };
  jwt: string | null;
  isLoading: boolean;
  convention: ConventionReadDto | null;
  conventionStatusDashboardUrl: AbsoluteUrl | null;
  fetchError: string | null;
  feedback: ConventionSubmitFeedback;
  currentSignatoryRole: SignatoryRole | null;
}

export const initialConventionState: ConventionState = {
  formUi: {
    preselectedAgencyId: null,
    isMinor: false,
    isTutorEstablishmentRepresentative: true,
    hasCurrentEmployer: false,
    currentStep: 1,
    showSummary: false,
    agencyDepartment: null,
  },
  jwt: null,
  convention: null,
  conventionStatusDashboardUrl: null,
  isLoading: false,
  fetchError: null,
  feedback: { kind: "idle" },
  currentSignatoryRole: null,
};

export type FetchConventionRequestedPayload = {
  jwt: ConventionMagicLinkJwt | BackOfficeJwt;
  conventionId: ConventionId;
};

type StatusChangePayload = {
  feedbackKind: ConventionFeedbackKind;
  jwt: ConventionMagicLinkJwt | BackOfficeJwt;
  conventionId: ConventionId;
  updateStatusParams: UpdateConventionStatusRequestDto;
};

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
  initialState: initialConventionState,
  reducers: {
    showSummaryChangeRequested: (
      state,
      action: PayloadAction<{
        showSummary: boolean;
        convention?: ConventionReadDto;
      }>,
    ) => {
      state.formUi.showSummary = action.payload.showSummary;
      if (action.payload.convention) {
        state.convention = action.payload.convention;
      }
    },
    agencyDepartementChangeRequested: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.formUi.agencyDepartment = action.payload;
    },
    // Save convention
    saveConventionRequested: (
      state,
      action: PayloadAction<ConventionReadDto>,
    ) => {
      state.isLoading = true;
      state.convention = action.payload;
    },
    saveConventionSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "justSubmitted" };
    },
    saveConventionFailed: setFeedbackAsErrored,

    // Get convention from token
    fetchConventionRequested: (
      state,
      _action: PayloadAction<FetchConventionRequestedPayload>,
    ) => {
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
        jwt: ConventionMagicLinkJwt;
        role: SignatoryRole;
        signedAt: DateIsoStr;
      }>,
    ) => {
      state.isLoading = true;
    },
    signConventionSucceeded: (
      state,
      _action: PayloadAction<{ role: SignatoryRole; signedAt: DateIsoStr }>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "signedSuccessfully" };
      state.convention = null;
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
      _action: PayloadAction<ConventionMagicLinkJwt>,
    ) => {
      state.feedback = { kind: "idle" };
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
      state.convention = initialConventionState.convention;
      state.formUi = initialConventionState.formUi;
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

    preselectedAgencyIdRequested: (state) => {
      state.isLoading = true;
    },
    preselectedAgencyIdSucceeded: (
      state,
      { payload }: PayloadAction<AgencyId | null>,
    ) => {
      state.isLoading = false;
      state.formUi.preselectedAgencyId = payload;
    },
    preselectedAgencyIdFailed: setFeedbackAsErrored,
    setCurrentStep: (state, { payload }: PayloadAction<NumberOfSteps>) => {
      state.formUi.currentStep = payload;
    },
  },
});

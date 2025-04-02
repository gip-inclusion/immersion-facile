import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type {
  AbsoluteUrl,
  AgencyId,
  ConventionId,
  ConventionJwt,
  ConventionReadDto,
  ConventionSupportedJwt,
  DiscussionId,
  FindSimilarConventionsParams,
  SignatoryRole,
} from "shared";
import type { SubmitFeedBack } from "../SubmitFeedback";

type ConventionSignatoryFeedbackKind = "justSubmitted";

export type ConventionFeedbackKind = ConventionSignatoryFeedbackKind;

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
  similarConventionIds: ConventionId[];
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
  similarConventionIds: [],
};

export type FetchConventionRequestedPayload = {
  jwt: ConventionSupportedJwt;
  conventionId: ConventionId;
};

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
      action: PayloadAction<{
        convention: ConventionReadDto;
        discussionId?: DiscussionId;
      }>,
    ) => {
      state.isLoading = true;
      state.convention = action.payload.convention;
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

    // get convention status dashboard
    conventionStatusDashboardRequested: (
      state,
      _action: PayloadAction<ConventionJwt>,
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

    setCurrentStep: (state, { payload }: PayloadAction<NumberOfSteps>) => {
      state.formUi.currentStep = payload;
    },

    // Get similar conventions
    getSimilarConventionsRequested: (
      state,
      _action: PayloadAction<FindSimilarConventionsParams>,
    ) => {
      state.isLoading = true;
    },

    getSimilarConventionsSucceeded: (
      state,
      { payload }: PayloadAction<ConventionId[]>,
    ) => {
      state.isLoading = false;
      state.similarConventionIds = payload;
    },
    getSimilarConventionsFailed: setFeedbackAsErrored,
  },
});

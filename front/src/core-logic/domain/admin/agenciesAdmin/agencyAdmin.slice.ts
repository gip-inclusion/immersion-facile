import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AgencyDto,
  AgencyId,
  AgencyOption,
  UpdateAgencyStatusParams,
} from "shared";
import type { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AgencyAdminSuccessFeedbackKind = "agencyUpdated";

export type AgencyAdminSubmitFeedback =
  SubmitFeedBack<AgencyAdminSuccessFeedbackKind>;

export interface AgencyAdminState {
  agencySearchQuery: string;
  agencyOptions: AgencyOption[];
  agencyNeedingReview: AgencyDto | null;
  isFetchingAgenciesNeedingReview: boolean;
  isLoading: boolean;
  error: string | null;
  feedback: AgencyAdminSubmitFeedback; //todo merge feedback and error in submitFeedback
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencySearchQuery: "",
  agencyOptions: [],
  agencyNeedingReview: null,
  isFetchingAgenciesNeedingReview: false,
  isLoading: false,
  feedback: { kind: "idle" },
  error: null,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState: agencyAdminInitialState,
  reducers: {
    fetchAgencyNeedingReviewRequested: (
      state,
      _action: PayloadAction<AgencyId>,
    ) => {
      state.feedback = { kind: "idle" };
    },
    fetchAgencyNeedingReviewSucceeded: (
      state,
      action: PayloadAction<AgencyDto | null>,
    ) => {
      state.agencyNeedingReview = action.payload ?? null;
    },
    fetchAgencyNeedingReviewFailed: (state, action: PayloadAction<string>) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    setAgencySearchQuery: (state, action: PayloadAction<string>) => {
      state.agencySearchQuery = action.payload;
      state.isLoading = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isLoading = false;
      state.isFetchingAgenciesNeedingReview = false;
    },
    updateAgencyNeedingReviewStatusRequested: (
      state,
      _action: PayloadAction<UpdateAgencyStatusParams>,
    ) => {
      state.isLoading = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencyNeedingReviewStatusSucceeded: (
      state,
      _action: PayloadAction<AgencyId>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyNeedingReviewStatusFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    clearAgencyNeedingReview: (state) => {
      state.agencyNeedingReview = null;
    },
  },
});

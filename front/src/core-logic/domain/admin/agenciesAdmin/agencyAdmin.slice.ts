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
  agency: AgencyDto | null;
  agencyNeedingReview: AgencyDto | null;

  isSearching: boolean;
  isFetchingAgenciesNeedingReview: boolean;

  isUpdating: boolean;

  error: string | null;
  feedback: AgencyAdminSubmitFeedback;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencySearchQuery: "",
  agencyOptions: [],
  agency: null,
  agencyNeedingReview: null,

  isSearching: false,
  isFetchingAgenciesNeedingReview: false,
  isUpdating: false,

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
      state.agency = null;
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
      state.isSearching = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isSearching = false;
      state.isFetchingAgenciesNeedingReview = false;
    },
    setSelectedAgencyId: (state, _action: PayloadAction<AgencyId>) => {
      state.feedback = { kind: "idle" };
      state.agency = null;
    },

    setAgency: (state, action: PayloadAction<AgencyDto | null>) => {
      state.agency = action.payload ?? null;
    },

    updateAgencyRequested: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencySucceeded: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    updateAgencyNeedingReviewStatusRequested: (
      state,
      _action: PayloadAction<UpdateAgencyStatusParams>,
    ) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencyNeedingReviewStatusSucceeded: (
      state,
      _action: PayloadAction<AgencyId>,
    ) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyNeedingReviewStatusFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    clearAgencyRequested: (state) => {
      state.agency = null;
      state.agencyNeedingReview = null;
    },
  },
});

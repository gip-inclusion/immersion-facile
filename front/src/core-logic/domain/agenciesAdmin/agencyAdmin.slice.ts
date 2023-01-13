import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyDto, AgencyId, AgencyOption } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AgencySuccessFeedbackKind = "agencyAdded" | "agencyUpdated";
export type AgencySubmitFeedback = SubmitFeedBack<AgencySuccessFeedbackKind>;

export interface AgencyAdminState {
  agencySearchText: string;
  agencyOptions: AgencyOption[];
  agencyNeedingReviewOptions: AgencyOption[];
  agency: AgencyDto | null;
  agencyNeedingReview: AgencyDto | null;
  isSearching: boolean;
  isFetchingAgenciesNeedingReview: boolean;
  isUpdating: boolean;
  error: string | null;
  feedback: AgencySubmitFeedback;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencyNeedingReviewOptions: [],
  agencySearchText: "",
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
    fetchAgenciesNeedingReviewRequested: (state) => {
      state.isFetchingAgenciesNeedingReview = true;
      state.agencyNeedingReviewOptions = [];
    },
    setAgencySearchText: (state, action: PayloadAction<string>) => {
      state.agencySearchText = action.payload;
      state.isSearching = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isSearching = false;
      state.isFetchingAgenciesNeedingReview = false;
    },
    setAgencyNeedingReviewOptions: (
      state,
      action: PayloadAction<AgencyOption[]>,
    ) => {
      state.agencyNeedingReviewOptions = action.payload;
      state.isFetchingAgenciesNeedingReview = false;
    },
    setSelectedAgencyId: (state, _action: PayloadAction<AgencyId>) => {
      state.feedback = { kind: "idle" };
      state.agency = null;
    },
    setSelectedAgencyNeedingReviewId: (
      state,
      _action: PayloadAction<AgencyId>,
    ) => {
      state.feedback = { kind: "idle" };
      state.agency = null;
    },
    setAgency: (state, action: PayloadAction<AgencyDto | null>) => {
      state.agency = action.payload ?? null;
    },
    setAgencyNeedingReview: (
      state,
      action: PayloadAction<AgencyDto | null>,
    ) => {
      state.agencyNeedingReview = action.payload ?? null;
    },
    fetchAgenciesNeedingReviewFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isFetchingAgenciesNeedingReview = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    updateAgencyRequested: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencySucceeded: (state) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});

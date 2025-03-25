import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
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
  agencyNeedingReviewOptions: AgencyOption[];
  agency: AgencyDto | null;
  agencyNeedingReview: AgencyDto | null;
  // inclusionConnectedUsersNeedingReview: NormalizedInclusionConnectedUserById;
  // selectedUserId: AuthenticatedUserId | null;

  isSearching: boolean;
  isFetchingAgenciesNeedingReview: boolean;

  isUpdating: boolean;

  error: string | null;
  feedback: AgencyAdminSubmitFeedback;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencyNeedingReviewOptions: [],
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
    fetchAgenciesNeedingReviewRequested: (state) => {
      state.isFetchingAgenciesNeedingReview = true;
      state.agencyNeedingReviewOptions = [];
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
    setSelectedAgencyNeedingReviewIdFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
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
    updateAgencySucceeded: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
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
    updateAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    updateAgencyStatusFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    agencyNeedingReviewChangedAfterAnUpdate: (
      state,
      action: PayloadAction<{
        agencyNeedingReviewOptions: AgencyOption[];
        agencyNeedingReview: AgencyDto | null;
      }>,
    ) => {
      state.agencyNeedingReviewOptions =
        action.payload.agencyNeedingReviewOptions;
      state.agencyNeedingReview = action.payload.agencyNeedingReview;
    },
    clearAgencyRequested: (state) => {
      state.agency = null;
      state.agencyNeedingReview = null;
    },
  },
});

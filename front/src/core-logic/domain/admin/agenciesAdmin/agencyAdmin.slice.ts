import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AgencyDto,
  AgencyOption,
  UpdateAgencyStatusParams,
  WithAgencyId,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface AgencyAdminState {
  agencySearchQuery: string;
  agencyOptions: AgencyOption[];
  agencyNeedingReview: AgencyDto | null;
  isLoading: boolean;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencySearchQuery: "",
  agencyOptions: [],
  agencyNeedingReview: null,
  isLoading: false,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState: agencyAdminInitialState,
  reducers: {
    fetchAgencyNeedingReviewRequested: (
      _state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {},

    fetchAgencyNeedingReviewSucceeded: (
      state,
      action: PayloadAction<AgencyDto | null>,
    ) => {
      state.agencyNeedingReview = action.payload ?? null;
    },
    fetchAgencyNeedingReviewFailed: (
      _state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {},

    setAgencySearchQuery: (state, action: PayloadAction<string>) => {
      state.agencySearchQuery = action.payload;
      state.isLoading = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isLoading = false;
    },
    updateAgencyNeedingReviewStatusRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UpdateAgencyStatusParams>,
    ) => {
      state.isLoading = true;
    },
    updateAgencyNeedingReviewStatusSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {
      state.isLoading = false;
    },
    updateAgencyNeedingReviewStatusFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    clearAgencyNeedingReview: (state) => {
      state.agencyNeedingReview = null;
    },
  },
});

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AgencyDto, UpdateAgencyStatusParams, WithAgencyId } from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface AgencyNeedingReviewState {
  agencyNeedingReview: AgencyDto | null;
  isLoading: boolean;
}

export const agencyNeedingReviewInitialState: AgencyNeedingReviewState = {
  agencyNeedingReview: null,
  isLoading: false,
};

export const agencyNeedingReviewSlice = createSlice({
  name: "agencyNeedingReview",
  initialState: agencyNeedingReviewInitialState,
  reducers: {
    fetchAgencyNeedingReviewRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {
      state.isLoading = true;
    },

    fetchAgencyNeedingReviewSucceeded: (
      state,
      action: PayloadAction<AgencyDto | null>,
    ) => {
      state.agencyNeedingReview = action.payload ?? null;
      state.isLoading = false;
    },

    fetchAgencyNeedingReviewFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    clearAgencyNeedingReview: (state) => {
      state.agencyNeedingReview = null;
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
  },
});

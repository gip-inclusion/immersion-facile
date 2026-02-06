import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AgencyDto, WithAgencyId } from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface agencyNeedingReviewState {
  agencyNeedingReview: AgencyDto | null;
}

export const agencyNeedingReviewInitialState: agencyNeedingReviewState = {
  agencyNeedingReview: null,
};

export const agencyNeedingReviewSlice = createSlice({
  name: "agencyNeedingReview",
  initialState: agencyNeedingReviewInitialState,
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

    clearAgencyNeedingReview: (state) => {
      state.agencyNeedingReview = null;
    },
  },
});

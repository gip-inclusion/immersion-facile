import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
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
  isLoading: boolean;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencySearchQuery: "",
  agencyOptions: [],
  isLoading: false,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState: agencyAdminInitialState,
  reducers: {
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
  },
});

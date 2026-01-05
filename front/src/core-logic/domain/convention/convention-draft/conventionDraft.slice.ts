import { createSlice } from "@reduxjs/toolkit";
import type { ConventionDraftDto, ConventionDraftId } from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface ConventionDraftState {
  conventionDraft: ConventionDraftDto | null;
  isLoading: boolean;
}

export const initialConventionDraftState: ConventionDraftState = {
  conventionDraft: null,
  isLoading: false,
};

export const conventionDraftSlice = createSlice({
  name: "conventionDraft",
  initialState: initialConventionDraftState,
  reducers: {
    fetchConventionDraftRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        conventionDraftId: ConventionDraftId;
      }>,
    ) => {
      state.isLoading = true;
    },
    fetchConventionDraftSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        conventionDraft: ConventionDraftDto | undefined;
      }>,
    ) => {
      state.conventionDraft = action.payload.conventionDraft ?? null;
      state.isLoading = false;
    },
    fetchConventionDraftFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

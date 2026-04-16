import { createSlice } from "@reduxjs/toolkit";
import type {
  AbsoluteUrl,
  ConventionDraftDto,
  ConventionDraftId,
  ShareConventionDraftByEmailDto,
} from "shared";
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
    saveConventionDraftThenRedirectRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        ShareConventionDraftByEmailDto & { redirectUrl?: AbsoluteUrl }
      >,
    ) => {
      state.isLoading = true;
    },
    saveConventionDraftThenRedirectSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        ShareConventionDraftByEmailDto & { redirectUrl?: AbsoluteUrl }
      >,
    ) => {
      state.isLoading = false;
    },
    saveConventionDraftThenRedirectFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

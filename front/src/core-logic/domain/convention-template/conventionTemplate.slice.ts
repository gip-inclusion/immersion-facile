import { createSlice } from "@reduxjs/toolkit";
import type { ConnectedUserJwt, ConventionTemplate } from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type FetchConventionTemplatesRequestedPayload = {
  jwt: ConnectedUserJwt;
};

export interface ConventionTemplateState {
  isLoading: boolean;
  conventionTemplates: ConventionTemplate[];
}

export const initialConventionTemplateState: ConventionTemplateState = {
  isLoading: false,
  conventionTemplates: [],
};

export const conventionTemplateSlice = createSlice({
  name: "conventionTemplate",
  initialState: initialConventionTemplateState,
  reducers: {
    createOrUpdateConventionTemplateRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        conventionTemplate: ConventionTemplate;
        jwt: ConnectedUserJwt;
      }>,
    ) => {
      state.isLoading = true;
    },
    createOrUpdateConventionTemplateSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        conventionTemplate: ConventionTemplate;
      }>,
    ) => {
      state.isLoading = false;
    },
    createOrUpdateConventionTemplateFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    fetchConventionTemplatesRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<FetchConventionTemplatesRequestedPayload>,
    ) => {
      state.isLoading = true;
      state.conventionTemplates = [];
    },
    fetchConventionTemplatesSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        conventionTemplates: ConventionTemplate[];
      }>,
    ) => {
      state.isLoading = false;
      state.conventionTemplates = action.payload.conventionTemplates;
    },
    fetchConventionTemplatesFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

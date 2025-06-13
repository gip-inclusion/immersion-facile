import { createSlice } from "@reduxjs/toolkit";
import type { ConventionSupportedJwt, WithConventionId } from "shared";

import type { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface SendAssessmentLinkState {
  isSending: boolean;
}

export const sendAssessmentLinkInitialState: SendAssessmentLinkState = {
  isSending: false,
};

export const sendAssessmentLinkSlice = createSlice({
  name: "sendAssessmentLink",
  initialState: sendAssessmentLinkInitialState,
  reducers: {
    sendAssessmentLinkRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        WithConventionId & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isSending = true;
    },

    sendAssessmentLinkSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        WithConventionId & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isSending = false;
    },

    sendAssessmentLinkFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isSending = false;
    },
  },
});

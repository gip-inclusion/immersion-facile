import { createSlice } from "@reduxjs/toolkit";
import { ConventionSupportedJwt, SendSignatureLinkRequestDto } from "shared";

import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface SendSignatureLinkState {
  isLoading: boolean;
}

export const sendSignatureLinkInitialState: SendSignatureLinkState = {
  isLoading: false,
};

export const sendSignatureLinkSlice = createSlice({
  name: "sendSignatureLink",
  initialState: sendSignatureLinkInitialState,
  reducers: {
    sendSignatureLinkRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        SendSignatureLinkRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isLoading = true;
    },

    sendSignatureLinkSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        SendSignatureLinkRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isLoading = false;
    },

    sendSignatureLinkFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

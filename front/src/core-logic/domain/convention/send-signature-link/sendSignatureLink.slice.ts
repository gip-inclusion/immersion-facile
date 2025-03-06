import { createSlice } from "@reduxjs/toolkit";
import { ConventionSupportedJwt, SendSignatureLinkRequestDto } from "shared";

import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface SendSignatureLinkState {
  isSending: boolean;
}

export const sendSignatureLinkInitialState: SendSignatureLinkState = {
  isSending: false,
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
      state.isSending = true;
    },

    sendSignatureLinkSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        SendSignatureLinkRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isSending = false;
    },

    sendSignatureLinkFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isSending = false;
    },
  },
});

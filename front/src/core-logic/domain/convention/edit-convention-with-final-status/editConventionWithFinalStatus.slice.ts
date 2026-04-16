import { createSlice } from "@reduxjs/toolkit";
import type {
  ConnectedUserJwt,
  EditConventionWithFinalStatusRequestDto,
} from "shared";

import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface EditConventionWithFinalStatusState {
  isLoading: boolean;
}

export const editConventionWithFinalStatusInitialState: EditConventionWithFinalStatusState =
  {
    isLoading: false,
  };

export const editConventionWithFinalStatusSlice = createSlice({
  name: "editConventionWithFinalStatus",
  initialState: editConventionWithFinalStatusInitialState,
  reducers: {
    editConventionWithFinalStatusRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        EditConventionWithFinalStatusRequestDto & { jwt: ConnectedUserJwt }
      >,
    ) => {
      state.isLoading = true;
    },

    editConventionWithFinalStatusSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        EditConventionWithFinalStatusRequestDto & { jwt: ConnectedUserJwt }
      >,
    ) => {
      state.isLoading = false;
    },

    editConventionWithFinalStatusFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

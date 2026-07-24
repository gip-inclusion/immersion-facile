import { createSlice } from "@reduxjs/toolkit";
import type {
  ArchivedConventionRequestFormDto,
  ConnectedUserJwt,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export interface ArchivedConventionRequestState {
  isLoading: boolean;
}

export const initialArchivedConventionRequestState: ArchivedConventionRequestState =
  {
    isLoading: false,
  };

export const archivedConventionRequestSlice = createSlice({
  name: "archivedConventionRequest",
  initialState: initialArchivedConventionRequestState,
  reducers: {
    saveArchivedConventionRequestRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        archivedConventionRequest: ArchivedConventionRequestFormDto;
        jwt: ConnectedUserJwt;
      }>,
    ) => {
      state.isLoading = true;
    },
    saveArchivedConventionRequestSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    saveArchivedConventionRequestFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

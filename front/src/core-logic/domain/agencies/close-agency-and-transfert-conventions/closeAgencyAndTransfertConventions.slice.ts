import { createSlice } from "@reduxjs/toolkit";
import type {
  AgencyId,
  CloseAgencyAndTransfertConventionsRequestDto,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type CloseAgencyAndTransfertConventionsState = {
  isLoading: boolean;
};

export const closeAgencyAndTransfertConventionsInitialState: CloseAgencyAndTransfertConventionsState =
  {
    isLoading: false,
  };

export const closeAgencyAndTransfertConventionsSlice = createSlice({
  name: "closeAgencyAndTransfertConventions",
  initialState: closeAgencyAndTransfertConventionsInitialState,
  reducers: {
    closeAgencyAndTransfertConventionsRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<CloseAgencyAndTransfertConventionsRequestDto>,
    ) => {
      state.isLoading = true;
    },
    closeAgencyAndTransfertConventionsSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ agencyId: AgencyId }>,
    ) => {
      state.isLoading = false;
    },
    closeAgencyAndTransfertConventionsFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

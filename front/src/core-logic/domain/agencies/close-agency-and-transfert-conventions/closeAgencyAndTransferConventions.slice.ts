import { createSlice } from "@reduxjs/toolkit";
import type {
  AgencyId,
  CloseAgencyAndTransferConventionsRequestDto,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type CloseAgencyAndTransferConventionsState = {
  isLoading: boolean;
};

export const closeAgencyAndTransferConventionsInitialState: CloseAgencyAndTransferConventionsState =
  {
    isLoading: false,
  };

export const closeAgencyAndTransferConventionsSlice = createSlice({
  name: "closeAgencyAndTransferConventions",
  initialState: closeAgencyAndTransferConventionsInitialState,
  reducers: {
    closeAgencyAndTransferConventionsRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<CloseAgencyAndTransferConventionsRequestDto>,
    ) => {
      state.isLoading = true;
    },
    closeAgencyAndTransferConventionsSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ agencyId: AgencyId }>,
    ) => {
      state.isLoading = false;
    },
    closeAgencyAndTransferConventionsFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

import { createSlice } from "@reduxjs/toolkit";
import type {
  ConventionSupportedJwt,
  TransferConventionToAgencyRequestDto,
} from "shared";

import type { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface TransferConventionToAgencyState {
  isLoading: boolean;
}

export const transferConventionToAgencyInitialState: TransferConventionToAgencyState =
  {
    isLoading: false,
  };

export const transferConventionToAgencySlice = createSlice({
  name: "transferConventionToAgency",
  initialState: transferConventionToAgencyInitialState,
  reducers: {
    transferConventionToAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        TransferConventionToAgencyRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isLoading = true;
    },

    transferConventionToAgencySucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        TransferConventionToAgencyRequestDto & { jwt: ConventionSupportedJwt }
      >,
    ) => {
      state.isLoading = false;
    },

    transferConventionToAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

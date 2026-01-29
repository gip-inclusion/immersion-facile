import { createSlice } from "@reduxjs/toolkit";
import type {
  ConnectedUserJwt,
  EditBeneficiaryBirthdateRequestDto,
} from "shared";

import type { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface EditBeneficiaryBirthdateState {
  isLoading: boolean;
}

export const editBeneficiaryBirthdateInitialState: EditBeneficiaryBirthdateState =
  {
    isLoading: false,
  };

export const editBeneficiaryBirthdateSlice = createSlice({
  name: "editBeneficiaryBirthdate",
  initialState: editBeneficiaryBirthdateInitialState,
  reducers: {
    editBeneficiaryBirthdateRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        EditBeneficiaryBirthdateRequestDto & { jwt: ConnectedUserJwt }
      >,
    ) => {
      state.isLoading = true;
    },

    editBeneficiaryBirthdateSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        EditBeneficiaryBirthdateRequestDto & { jwt: ConnectedUserJwt }
      >,
    ) => {
      state.isLoading = false;
    },

    editBeneficiaryBirthdateFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

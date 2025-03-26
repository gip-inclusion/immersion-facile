import { createSlice } from "@reduxjs/toolkit";
import type {
  ConnectedUserJwt,
  ConventionId,
  ConventionJwt,
  ConventionSupportedJwt,
  TransferConventionToAgencyRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";

import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type StatusChangePayload = {
  jwt: ConventionSupportedJwt;
  updateStatusParams: UpdateConventionStatusRequestDto;
};

type TransferConventionToAgencyPayload = {
  jwt: ConventionSupportedJwt;
  transferConventionToAgencyParams: TransferConventionToAgencyRequestDto;
};

export interface ConventionActionState {
  isLoading: boolean;
  isBroadcasting: boolean;
}

export const conventionActionInitialState: ConventionActionState = {
  isLoading: false,
  isBroadcasting: false,
};

type SignPayload = {
  conventionId: ConventionId;
  jwt: ConventionJwt | ConnectedUserJwt;
};

export const conventionActionSlice = createSlice({
  name: "conventionAction",
  initialState: conventionActionInitialState,
  reducers: {
    cancelConventionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },

    cancelConventionSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = false;
    },

    cancelConventionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    editConventionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },

    editConventionSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = false;
    },

    editConventionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    deprecateConventionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },

    deprecateConventionSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = false;
    },

    deprecateConventionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    rejectConventionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },

    rejectConventionSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = false;
    },

    rejectConventionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    acceptByCounsellorRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },

    acceptByCounsellorSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = false;
    },

    acceptByCounsellorFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    acceptByValidatorRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = true;
    },

    acceptByValidatorSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<StatusChangePayload>,
    ) => {
      state.isLoading = false;
    },

    acceptByValidatorFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    transferConventionToAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<TransferConventionToAgencyPayload>,
    ) => {
      state.isLoading = true;
    },

    transferConventionToAgencySucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<TransferConventionToAgencyPayload>,
    ) => {
      state.isLoading = false;
    },

    transferConventionToAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    broadcastConventionToPartnerRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithConventionId>,
    ) => {
      state.isBroadcasting = true;
    },
    broadcastConventionToPartnerSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isBroadcasting = false;
    },
    broadcastConventionToPartnerFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isBroadcasting = false;
    },

    signConventionRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<SignPayload>,
    ) => {
      state.isLoading = true;
    },
    signConventionSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<SignPayload>,
    ) => {
      state.isLoading = false;
    },
    signConventionFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

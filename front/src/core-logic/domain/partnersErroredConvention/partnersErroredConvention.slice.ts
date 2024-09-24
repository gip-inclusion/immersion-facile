import { createSlice } from "@reduxjs/toolkit";
import {
  ConventionSupportedJwt,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { PayloadActionWithFeedbackTopic } from "../feedback/feedback.slice";

export interface PartnersErroredConventionState {
  isLoading: boolean;
}

export const initialPartnersErroredConventionState: PartnersErroredConventionState =
  {
    isLoading: false,
  };

type MarkPartnersErroredConventionAsHandledRequestPayload = {
  jwt: ConventionSupportedJwt;
  markAsHandledParams: MarkPartnersErroredConventionAsHandledRequest;
};

export const partnersErroredConventionSlice = createSlice({
  name: "partnersErroredConvention",
  initialState: initialPartnersErroredConventionState,
  reducers: {
    markAsHandledRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<MarkPartnersErroredConventionAsHandledRequestPayload>,
    ) => {
      state.isLoading = true;
    },
    markAsHandledSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    markAsHandledFailed: (
      state: PartnersErroredConventionState,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ConventionSupportedJwt,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type PartnersErroredConventionFeedbackKind = "markedAsHandled";

export type PartnersErroredConventionSubmitFeedback =
  SubmitFeedBack<PartnersErroredConventionFeedbackKind>;

export interface PartnersErroredConventionState {
  isLoading: boolean;
  feedback: PartnersErroredConventionSubmitFeedback;
}

export const initialPartnersErroredConventionState: PartnersErroredConventionState =
  {
    isLoading: false,
    feedback: { kind: "idle" },
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
      _action: PayloadAction<MarkPartnersErroredConventionAsHandledRequestPayload>,
    ) => {
      state.isLoading = true;
    },
    markAsHandledSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "markedAsHandled" };
    },
    markAsHandledFailed: (
      state: PartnersErroredConventionState,
      action: PayloadAction<string>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});

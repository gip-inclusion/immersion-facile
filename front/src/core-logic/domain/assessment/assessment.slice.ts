import { createSlice } from "@reduxjs/toolkit";
import { AssessmentDto } from "shared";
import {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";
import { AssessmentAndJwt } from "src/core-logic/ports/AssessmentGateway";

export interface AssessmentState {
  isLoading: boolean;
  currentAssessment: AssessmentDto | null;
}

const initialState: AssessmentState = {
  isLoading: false,
  currentAssessment: null,
};

export const assessmentSlice = createSlice({
  name: "assessment",
  initialState,
  reducers: {
    creationRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        assessmentAndJwt: AssessmentAndJwt;
      }>,
    ) => {
      state.isLoading = true;
    },
    creationSucceeded: (state, _action: PayloadActionWithFeedbackTopic) => {
      state.isLoading = false;
    },
    creationFailed: (state, _action: PayloadActionWithFeedbackTopicError) => {
      state.isLoading = false;
    },
  },
});

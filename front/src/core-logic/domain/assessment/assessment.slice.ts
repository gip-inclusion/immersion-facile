import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AssessmentDto, ConventionId, LegacyAssessmentDto } from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";
import type { AssessmentAndJwt } from "src/core-logic/ports/AssessmentGateway";

export interface AssessmentState {
  isLoading: boolean;
  currentAssessment: AssessmentDto | LegacyAssessmentDto | null;
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
    getAssessmentRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        conventionId: ConventionId;
        jwt: string;
      }>,
    ) => {
      state.isLoading = true;
    },
    getAssessmentSucceeded: (
      state,
      action: PayloadAction<AssessmentDto | LegacyAssessmentDto>,
    ) => {
      state.isLoading = false;
      state.currentAssessment = action.payload;
    },
    noAssessmentForConventionFound: (state) => {
      state.isLoading = false;
    },
    getAssessmentFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});

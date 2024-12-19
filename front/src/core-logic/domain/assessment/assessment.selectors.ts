import type { RootState } from "src/core-logic/storeConfig/store";

const assessmentState = (state: RootState) => state.assessment;

const isLoading = (state: RootState) => assessmentState(state).isLoading;

const currentAssessment = (state: RootState) =>
  assessmentState(state).currentAssessment;

export const assessmentSelectors = {
  assessmentState,
  isLoading,
  currentAssessment,
};

import type { RootState } from "src/core-logic/storeConfig/store";

export const immersionAssessmentErrorSelector = (state: RootState) =>
  state.immersionAssessment.error;
export const immersionAssessmentStatusSelector = (state: RootState) =>
  state.immersionAssessment.status;

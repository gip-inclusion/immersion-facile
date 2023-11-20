import type { RootState } from "src/core-logic/storeConfig/store";

export const assessmentErrorSelector = (state: RootState) =>
  state.assessment.error;
export const assessmentStatusSelector = (state: RootState) =>
  state.assessment.status;

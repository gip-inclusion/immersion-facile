import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionsWithBroadcastFeedbackState = (state: RootState) =>
  state.conventionsWithBroadcastFeedback;

export const conventionsWithBroadcastFeedbackSelectors = {
  isLoading: createSelector(
    conventionsWithBroadcastFeedbackState,
    ({ isLoading }) => isLoading,
  ),
  erroredBroadcastConventionsWithPagination: createSelector(
    conventionsWithBroadcastFeedbackState,
    ({ erroredBroadcastConventionsWithPagination }) =>
      erroredBroadcastConventionsWithPagination,
  ),
};

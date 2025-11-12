import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const conventionsWithBroadcastFeedbackState = createRootSelector(
  (state) => state.conventionsWithBroadcastFeedback,
);

const conventionsWithBroadcastFeedback = createSelector(
  conventionsWithBroadcastFeedbackState,
  (state) => state.conventions,
);

const pagination = createSelector(
  conventionsWithBroadcastFeedbackState,
  (state) => state.pagination,
);

const isLoading = createSelector(
  conventionsWithBroadcastFeedbackState,
  (state) => state.isLoading,
);

export const conventionsWithBroadcastFeedbackSelectors = {
  conventionsWithBroadcastFeedback,
  pagination,
  isLoading,
};

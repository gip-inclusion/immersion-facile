import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const agencyNeedingReviewState = (state: RootState) =>
  state.admin.agencyNeedingReview;

export const agencyNeedingReviewSelectors = {
  agencyNeedingReview: createSelector(
    agencyNeedingReviewState,
    ({ agencyNeedingReview }) => agencyNeedingReview ?? null,
  ),
};

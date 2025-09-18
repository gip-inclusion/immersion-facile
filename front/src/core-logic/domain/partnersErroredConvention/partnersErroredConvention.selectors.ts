import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const partnersErroredConventionState = (state: RootState) =>
  state.partnersErroredConvention;

export const partnersErroredConventionSelectors = {
  lastBroadcastFeedback: createSelector(
    partnersErroredConventionState,
    (state) => state.lastBroadcastFeedback,
  ),
  isLoading: createSelector(
    partnersErroredConventionState,
    (state) => state.isLoading,
  ),
};

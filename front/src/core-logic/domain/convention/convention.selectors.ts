import type { RootState } from "src/core-logic/storeConfig/store";
import { createSelector } from "@reduxjs/toolkit";

const conventionState = (state: RootState) => state.convention;

const feedback = createSelector(conventionState, ({ feedback }) => feedback);

export const conventionSelectors = {
  conventionState,
  feedback,
};

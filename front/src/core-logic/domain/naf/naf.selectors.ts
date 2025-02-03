import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const nafState = createRootSelector((state) => state.naf);

const isLoading = createSelector(nafState, (state) => state.isLoading);

const currentNafSections = createSelector(
  nafState,
  (state) => state.currentNafSections,
);

const isDebouncing = createSelector(nafState, (state) => state.isDebouncing);

export const nafSelectors = {
  isLoading,
  currentNafSections,
  isDebouncing,
};

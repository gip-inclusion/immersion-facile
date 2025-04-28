import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const appellationState = createRootSelector((state) => state.appellation);

const isDebouncing = createSelector(
  appellationState,
  (state) => state.isDebouncing,
);

const suggestions = createSelector(
  appellationState,
  (state) => state.suggestions,
);

const isLoading = createSelector(appellationState, (state) => state.isLoading);

const query = createSelector(appellationState, (state) => state.query);

const values = createSelector(appellationState, (state) => state.values);

export const appellationSelectors = {
  suggestions,
  isLoading,
  query,
  values,
  isDebouncing,
};

import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const geocodingState = createRootSelector((state) => state.geocoding);

const isDebouncing = createSelector(
  geocodingState,
  (state) => state.isDebouncing,
);

const suggestions = createSelector(
  geocodingState,
  (state) => state.suggestions,
);

const isLoading = createSelector(geocodingState, (state) => state.isLoading);

const query = createSelector(geocodingState, (state) => state.query);

const value = createSelector(geocodingState, (state) => state.values);

export const geocodingSelectors = {
  suggestions,
  isLoading,
  query,
  value,
  isDebouncing,
};

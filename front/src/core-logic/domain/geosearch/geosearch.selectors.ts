import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const geosearchState = createRootSelector((state) => state.geosearch);

const isDebouncing = createSelector(
  geosearchState,
  (state) => state.isDebouncing,
);

const suggestions = createSelector(
  geosearchState,
  (state) => state.suggestions,
);

const isLoading = createSelector(geosearchState, (state) => state.isLoading);

const query = createSelector(geosearchState, (state) => state.query);

const value = createSelector(geosearchState, (state) => state.value);

export const geosearchSelectors = {
  suggestions,
  isLoading,
  query,
  value,
  isDebouncing,
};

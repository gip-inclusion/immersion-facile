import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const searchState = createRootSelector((state) => state.search);

const searchResultsWithPagination = createSelector(
  searchState,
  (state) => state.searchResultsWithPagination,
);

const isLoading = createSelector(searchState, (state) => state.isLoading);

const currentSearchResult = createSelector(
  searchState,
  (state) => state.currentSearchResult,
);

const searchParams = createSelector(searchState, (state) => state.searchParams);

export const searchSelectors = {
  searchResultsWithPagination,
  isLoading,
  currentSearchResult,
  searchParams,
};

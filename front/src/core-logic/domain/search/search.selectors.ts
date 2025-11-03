import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const searchState = createRootSelector((state) => state.search);

const searchResultsWithPagination = createSelector(
  searchState,
  (state) => state.searchResultWithPagination,
);

const searchStatus = createSelector(searchState, (state) => state.searchStatus);

const searchInfo = createSelector(
  searchStatus,
  searchResultsWithPagination,
  (status, resultsWithPagination) => {
    if (status === "noSearchMade") return "Veuillez sélectionner vos critères";
    if (status === "ok" && resultsWithPagination.data.length === 0)
      return "Pas de résultat. Essayez avec un plus grand rayon de recherche...";
    if (status === "extraFetch")
      return "Nous cherchons à compléter les résultats...";
    return null;
  },
);
const isLoading = createSelector(searchState, (state) => state.isLoading);

const currentSearchResult = createSelector(
  searchState,
  (state) => state.currentSearchResult,
);

const searchParams = createSelector(searchState, (state) => state.searchParams);

export const searchSelectors = {
  searchResultsWithPagination,
  searchStatus,
  searchInfo,
  isLoading,
  currentSearchResult,
  searchParams,
};

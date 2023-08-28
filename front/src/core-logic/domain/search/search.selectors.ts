import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const searchState = createRootSelector((state) => state.search);

const searchResults = createSelector(
  searchState,
  (state) => state.searchResults,
);

const searchStatus = createSelector(searchState, (state) => state.searchStatus);

const searchInfo = createSelector(
  searchStatus,
  searchResults,
  (status, results) => {
    if (status === "noSearchMade") return "Veuillez sélectionner vos critères";
    if (status === "ok" && results.length === 0)
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

const feedback = createSelector(searchState, (state) => state.feedback);

export const searchSelectors = {
  searchResults,
  searchStatus,
  searchInfo,
  isLoading,
  currentSearchResult,
  feedback,
};

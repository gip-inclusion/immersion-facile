import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const searchResults = (state: RootState) => state.search.searchResults;

const searchStatus = (state: RootState) => state.search.searchStatus;

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

export const searchSelectors = {
  searchResults,
  searchStatus,
  searchInfo,
};

import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const nafState = createRootSelector((state) => state.naf);

const isLoading = createSelector(nafState, (state) => state.isLoading);

const allSections = createSelector(nafState, (state) => state.allSections);

export const nafSelectors = {
  isLoading,
  allSections,
};

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionListState = (state: RootState) => state.conventionList;

export const conventionListSelectors = {
  isLoading: createSelector(conventionListState, ({ isLoading }) => isLoading),
  conventionsWithPagination: createSelector(
    conventionListState,
    ({ conventionsWithPagination }) => conventionsWithPagination,
  ),
};

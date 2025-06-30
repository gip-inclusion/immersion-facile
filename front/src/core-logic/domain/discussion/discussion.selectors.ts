import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const discussionState = (state: RootState) => state.discussion;

export const discussionSelectors = {
  isLoading: createSelector(discussionState, ({ isLoading }) => isLoading),
  discussion: createSelector(discussionState, ({ discussion }) => discussion),
  fetchError: createSelector(discussionState, ({ fetchError }) => fetchError),
  discussionsWithPagination: createSelector(
    discussionState,
    ({ discussionsWithPagination }) => discussionsWithPagination,
  ),
};

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionDraftState = (state: RootState) => state.conventionDraft;

const conventionDraft = createSelector(
  conventionDraftState,
  ({ conventionDraft }) => conventionDraft,
);

const isLoading = createSelector(
  conventionDraftState,
  ({ isLoading }) => isLoading,
);

export const conventionDraftSelectors = {
  conventionDraft,
  isLoading,
};

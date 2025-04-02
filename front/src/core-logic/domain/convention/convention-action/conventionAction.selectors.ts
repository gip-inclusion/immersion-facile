import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionActionState = (state: RootState) => state.conventionAction;

const isLoading = createSelector(
  conventionActionState,
  ({ isLoading }) => isLoading,
);

const isBroadcasting = createSelector(
  conventionActionState,
  ({ isBroadcasting }) => isBroadcasting,
);

export const conventionActionSelectors = {
  isLoading,
  isBroadcasting,
};

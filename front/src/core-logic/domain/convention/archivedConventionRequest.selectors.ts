import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const archivedConventionRequestState = createRootSelector(
  (state) => state.archivedConventionRequest,
);

const isLoading = createSelector(
  archivedConventionRequestState,
  ({ isLoading }) => isLoading,
);

export const archivedConventionRequestSelectors = {
  isLoading,
};

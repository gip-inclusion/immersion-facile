import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const inclusionConnectedState = createRootSelector(
  (state) => state.inclusionConnected,
);
const isLoading = createSelector(
  inclusionConnectedState,
  (state) => state.isLoading,
);

const currentUser = createSelector(
  inclusionConnectedState,
  (state) => state.currentUser,
);

const feedback = createSelector(
  inclusionConnectedState,
  (state) => state.feedback,
);

export const inclusionConnectedSelectors = {
  isLoading,
  currentUser,
  feedback,
};

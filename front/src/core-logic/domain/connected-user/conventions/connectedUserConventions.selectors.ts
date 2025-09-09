import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const connectedUserConventionsState = createRootSelector(
  (state) => state.connectedUserConventions,
);

const conventions = createSelector(
  connectedUserConventionsState,
  (state) => state.conventions,
);

const isLoading = createSelector(
  connectedUserConventionsState,
  (state) => state.isLoading,
);

export const connectedUserConventionsSelectors = {
  conventions,
  isLoading,
};

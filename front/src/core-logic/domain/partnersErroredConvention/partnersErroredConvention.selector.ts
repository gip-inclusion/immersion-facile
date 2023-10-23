import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const partnersErroredConvention = createRootSelector(
  (state) => state.partnersErroredConvention,
);

const feedback = createSelector(
  partnersErroredConvention,
  ({ feedback }) => feedback,
);

const isLoading = createSelector(
  partnersErroredConvention,
  ({ isLoading }) => isLoading,
);

export const partnersErroredConventionSelectors = {
  feedback,
  isLoading,
};

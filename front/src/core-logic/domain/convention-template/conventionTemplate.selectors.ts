import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const conventionTemplateState = (state: RootState) => state.conventionTemplate;

const isLoading = createSelector(
  conventionTemplateState,
  ({ isLoading }) => isLoading,
);

const conventionTemplates = createSelector(
  conventionTemplateState,
  ({ conventionTemplates }) => conventionTemplates,
);

export const conventionTemplateSelectors = {
  isLoading,
  conventionTemplates,
};

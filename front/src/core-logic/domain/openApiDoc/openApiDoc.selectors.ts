import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const openApiDocState = createRootSelector((state) => state.openApiDoc);

const isLoading = createSelector(openApiDocState, ({ isLoading }) => isLoading);

const openApiDoc = createSelector(
  openApiDocState,
  ({ openApiDoc }) => openApiDoc ?? undefined,
);

export const openApiDocSelectors = {
  openApiDoc,
  isLoading,
};

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const apiConsumerState = (state: RootState) => state.admin.apiConsumer;

const isLoading = createSelector(apiConsumerState, (state) => state.isLoading);

const apiConsumers = createSelector(
  apiConsumerState,
  (state) => state.apiConsumers,
);

const feedback = createSelector(apiConsumerState, (state) => state.feedback);

export const apiConsumerSelectors = {
  isLoading,
  apiConsumers,
  feedback,
};

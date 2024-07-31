import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const apiConsumerState = (state: RootState) => state.admin.apiConsumer;

const isLoading = createSelector(apiConsumerState, (state) => state.isLoading);

const apiConsumers = createSelector(
  apiConsumerState,
  (state) => state.apiConsumers,
);

const lastCreatedToken = createSelector(
  apiConsumerState,
  (state) => state.lastCreatedToken,
);

const apiConsumerNames = createSelector(
  apiConsumerState,
  ({ apiConsumerNames }) => apiConsumerNames,
);

export const apiConsumerSelectors = {
  isLoading,
  apiConsumers,
  apiConsumerNames,
  lastCreatedToken,
};

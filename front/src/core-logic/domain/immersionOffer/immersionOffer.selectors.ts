import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const immersionOfferState = createRootSelector((state) => state.immersionOffer);

const isLoading = createSelector(
  immersionOfferState,
  (state) => state.isLoading,
);

const currentImmersionOffer = createSelector(
  immersionOfferState,
  (state) => state.currentImmersionOffer,
);

const feedback = createSelector(immersionOfferState, (state) => state.feedback);

export const immersionOfferSelectors = {
  isLoading,
  currentImmersionOffer,
  feedback,
};

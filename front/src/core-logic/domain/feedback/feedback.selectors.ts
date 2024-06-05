import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const feedbacksState = createRootSelector((state) => state.feedbacks);

const feedbacks = createSelector(feedbacksState, (state) => state);

export const feedbacksSelectors = {
  feedbacks,
};

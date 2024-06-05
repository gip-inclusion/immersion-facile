import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const notificationsState = createRootSelector((state) => state.feedbacks);

const feedbacks = createSelector(notificationsState, (state) => state);

export const feedbacksSelectors = {
  feedbacks,
};

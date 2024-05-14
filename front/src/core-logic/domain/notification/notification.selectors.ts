import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const notificationsState = createRootSelector((state) => state.notifications);

const notifications = createSelector(notificationsState, (state) => state);

export const notificationsSelectors = {
  notifications,
};

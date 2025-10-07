import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const connectedUserConventionsToManageState = createRootSelector(
  (state) => state.connectedUserConventionsToManage,
);

const conventions = createSelector(
  connectedUserConventionsToManageState,
  (state) => state.conventions,
);

const pagination = createSelector(
  connectedUserConventionsToManageState,
  (state) => state.pagination,
);

const isLoading = createSelector(
  connectedUserConventionsToManageState,
  (state) => state.isLoading,
);

export const connectedUserConventionsToManageSelectors = {
  conventions,
  isLoading,
  pagination,
};

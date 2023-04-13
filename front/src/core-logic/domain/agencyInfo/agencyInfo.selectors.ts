import { createSelector } from "@reduxjs/toolkit";

import { createRootSelector } from "src/core-logic/storeConfig/store";

const agencyInfos = createRootSelector((state) => state.agencyInfo);

const feedback = createSelector(agencyInfos, ({ feedback }) => feedback);

const isLoading = createSelector(agencyInfos, ({ isLoading }) => isLoading);

const details = createSelector(agencyInfos, ({ details }) => details);

export const agencyInfoSelectors = {
  feedback,
  details,
  isLoading,
};

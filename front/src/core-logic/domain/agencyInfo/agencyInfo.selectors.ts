import { createRootSelector } from "src/core-logic/storeConfig/store";

const feedback = createRootSelector((state) => state.agencyInfo.feedback);

const isLoading = createRootSelector((state) => state.agencyInfo.isLoading);

const details = createRootSelector((state) => state.agencyInfo.details);

export const agencyInfoSelectors = {
  feedback,
  details,
  isLoading,
};

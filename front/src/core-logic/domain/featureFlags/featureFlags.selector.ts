import { RootState } from "src/core-logic/storeConfig/store";

const featureFlagState = (state: RootState) => state.featureFlags;

export const featureFlagSelectors = {
  featureFlagState,
};

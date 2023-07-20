import { createSelector } from "@reduxjs/toolkit";
import { hasFeatureFlagValue } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

export const featureFlagState = (state: RootState) => state.featureFlags;

export const maintenanceMessage = createSelector(
  featureFlagState,
  (featureFlags) =>
    hasFeatureFlagValue(featureFlags.enableMaintenance)
      ? featureFlags.enableMaintenance.value.message
      : "",
);

export const featureFlagSelectors = {
  maintenanceMessage,
  featureFlagState,
};

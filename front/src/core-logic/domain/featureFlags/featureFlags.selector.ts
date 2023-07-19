import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

export const featureFlagState = (state: RootState) => state.featureFlags;

export const maintenanceMessage = createSelector(
  featureFlagState,
  (featureFlags) =>
    "value" in featureFlags.enableMaintenance &&
    featureFlags.enableMaintenance.value
      ? featureFlags.enableMaintenance.value.message
      : "",
);

export const featureFlagSelectors = {
  maintenanceMessage,
  featureFlagState,
};

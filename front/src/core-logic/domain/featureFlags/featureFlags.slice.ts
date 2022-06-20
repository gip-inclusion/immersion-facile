import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FeatureFlags } from "shared/src/featureFlags";

export type FeatureFlagState = FeatureFlags & {
  areFeatureFlagsLoading: boolean;
};

const initialState: FeatureFlagState = {
  enableAdminUi: false,
  enableInseeApi: true,
  enablePeConnectApi: false,
  enableLogoUpload: false,
  enablePeConventionBroadcast: false,
  areFeatureFlagsLoading: true,
};

export const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    retrieveFeatureFlagsRequested: (state) => state,
    retrieveFeatureFlagsSucceeded: (
      _,
      action: PayloadAction<FeatureFlags>,
    ) => ({
      ...action.payload,
      areFeatureFlagsLoading: false,
    }),
  },
});

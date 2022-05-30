import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FeatureFlags } from "shared/src/featureFlags";

interface FeatureFlagsState {
  featureFlags: FeatureFlags;
}

const initialState: FeatureFlagsState = {
  featureFlags: {
    enableAdminUi: false,
    enableInseeApi: true,
    enablePeConnectApi: false,
    enableLogoUpload: false,
  },
};

export const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    retrieveFeatureFlagsRequested: (state) => state,
    retrieveFeatureFlagsSucceeded: (
      state,
      action: PayloadAction<FeatureFlags>,
    ) => {
      state.featureFlags = action.payload;
    },
  },
});

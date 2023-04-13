import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FeatureFlag, FeatureFlags } from "shared";

export type FeatureFlagsState = FeatureFlags & {
  isLoading: boolean;
};

const initialState: FeatureFlagsState = {
  enableInseeApi: true,
  enablePeConnectApi: false,
  enableLogoUpload: false,
  enablePeConventionBroadcast: false,
  enableTemporaryOperation: false,
  enableMaxContactPerWeek: false,
  isLoading: true,
};

export const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    retrieveFeatureFlagsRequested: (state) => state,
    retrieveFeatureFlagsSucceeded: (
      _,
      action: PayloadAction<FeatureFlags>,
    ): FeatureFlagsState => ({
      ...action.payload,
      isLoading: false,
    }),
    setFeatureFlagRequested: (
      state,
      action: PayloadAction<FeatureFlag>,
    ): FeatureFlagsState => ({
      ...state,
      isLoading: true,
      [action.payload]: !state[action.payload],
    }),
    setFeatureFlagSucceeded: (state): FeatureFlagsState => ({
      ...state,
      isLoading: false,
    }),
  },
});

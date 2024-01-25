import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  FeatureFlags,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  SetFeatureFlagParam,
} from "shared";

export type FeatureFlagsState = FeatureFlags & {
  isLoading: boolean;
};

const initialState: FeatureFlagsState = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    message: "",
    imageAlt: "",
    imageUrl: "https://",
    redirectUrl: "https://",
    overtitle: "",
    title: "",
  }),
  enableMaintenance: makeTextFeatureFlag(false, { message: "" }),
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
      action: PayloadAction<SetFeatureFlagParam>,
    ): FeatureFlagsState => ({
      ...state,
      isLoading: true,
      [action.payload.flagName]: {
        ...state[action.payload.flagName],
        ...action.payload.featureFlag,
      },
    }),
    setFeatureFlagSucceeded: (state): FeatureFlagsState => ({
      ...state,
      isLoading: false,
    }),
  },
});

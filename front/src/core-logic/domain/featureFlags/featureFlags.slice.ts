import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  FeatureFlags,
  SetFeatureFlagParam,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
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
  enableSearchByScore: makeBooleanFeatureFlag(false),
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

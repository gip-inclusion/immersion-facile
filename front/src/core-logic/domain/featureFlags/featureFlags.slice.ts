import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FeatureFlags } from "shared/src/featureFlags";

const initialState: FeatureFlags = {
  enableAdminUi: false,
  enableInseeApi: true,
  enablePeConnectApi: false,
  enableLogoUpload: false,
};

export const featureFlagsSlice = createSlice({
  name: "featureFlags",
  initialState,
  reducers: {
    retrieveFeatureFlagsRequested: (state) => state,
    retrieveFeatureFlagsSucceeded: (_, action: PayloadAction<FeatureFlags>) =>
      action.payload,
  },
});

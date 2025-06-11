import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  type FeatureFlags,
  type SetFeatureFlagParam,
  makeBooleanFeatureFlag,
  makeHighlightFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
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
  enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
    message: "",
    severity: "warning",
  }),
  enableSearchByScore: makeBooleanFeatureFlag(false),
  enableBroadcastOfConseilDepartementalToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfCapEmploiToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfMissionLocaleToFT: makeBooleanFeatureFlag(false),
  enableStandardFormatBroadcastToFranceTravail: makeBooleanFeatureFlag(false),
  enableEstablishmentDashboardHighlight: makeHighlightFeatureFlag(false, {
    title: "",
    message: "",
    href: "",
    label: "",
  }),
  enableAgencyDashboardHighlight: makeHighlightFeatureFlag(false, {
    title: "",
    message: "",
    href: "",
    label: "",
  }),
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

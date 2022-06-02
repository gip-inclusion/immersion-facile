import { RootState } from "src/core-logic/storeConfig/store";

export const featureFlagsSelector = (state: RootState) => state.featureFlags;

import type { RootState } from "src/core-logic/storeConfig/store";

const conventionState = (state: RootState) => state.convention;

export const conventionSelectors = {
  conventionState,
};

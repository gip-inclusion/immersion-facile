import type { RootState } from "src/core-logic/storeConfig/store";

export const conventionStateSelector = (state: RootState) =>
  state.immersionConvention;

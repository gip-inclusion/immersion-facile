import { RootState } from "src/core-logic/storeConfig/store";

const agenciesSelector = (state: RootState) => state.agencies.items;

export const agenciesSelectors = {
  agencies: agenciesSelector,
  isLoading: (state: RootState) => state.agencies.isLoading,
};

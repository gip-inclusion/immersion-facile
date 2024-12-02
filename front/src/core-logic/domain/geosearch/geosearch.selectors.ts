import { createRootSelector } from "src/core-logic/storeConfig/store";

const suggestions = createRootSelector((state) => state.geosearch.suggestions);

const isLoading = createRootSelector((state) => state.geosearch.isLoading);

const query = createRootSelector((state) => state.geosearch.query);

const value = createRootSelector((state) => state.geosearch.value);

export const geosearchSelectors = {
  suggestions,
  isLoading,
  query,
  value,
};

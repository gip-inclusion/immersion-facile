import { createSelector } from "@reduxjs/toolkit";
import type { GeosearchLocator } from "src/core-logic/domain/geosearch/geosearch.slice";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const geosearchState = createRootSelector((state) => state.geosearch);

export const makeGeosearchLocatorSelector = (locator: GeosearchLocator) =>
  createSelector(geosearchState, (state) => state.data[locator]);

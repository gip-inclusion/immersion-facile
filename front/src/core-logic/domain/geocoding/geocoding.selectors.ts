import { createSelector } from "@reduxjs/toolkit";
import type { AddressAutocompleteLocator } from "src/core-logic/domain/geocoding/geocoding.slice";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const geocodingState = createRootSelector((state) => state.geocoding);

export const makeGeocodingLocatorSelector = (
  locator: AddressAutocompleteLocator,
) => createSelector(geocodingState, (state) => state.data[locator]);

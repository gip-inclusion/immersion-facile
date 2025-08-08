import { createSelector } from "@reduxjs/toolkit";
import type { AddressWithCountryCodeAndPosition } from "shared";
import type { AutocompleteState } from "src/core-logic/domain/autocomplete.utils";
import type { AddressAutocompleteLocator } from "src/core-logic/domain/geocoding/geocoding.slice";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const geocodingState = createRootSelector((state) => state.geocoding);

export const makeGeocodingLocatorSelector = (
  locator: AddressAutocompleteLocator,
) =>
  createSelector(
    geocodingState,
    (
      state: AutocompleteState<
        AddressAutocompleteLocator,
        AddressWithCountryCodeAndPosition
      >,
    ) => state.data[locator],
  );

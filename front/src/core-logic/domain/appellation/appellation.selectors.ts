import { createSelector } from "@reduxjs/toolkit";
import type { AppellationAutocompleteLocator } from "src/core-logic/domain/appellation/appellation.slice";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const appellationState = createRootSelector((state) => state.appellation);

export const makeAppellationLocatorSelector = (
  locator: AppellationAutocompleteLocator,
) => createSelector(appellationState, (state) => state.data[locator]);

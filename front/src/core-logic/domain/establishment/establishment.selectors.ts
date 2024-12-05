import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const establishmentState = (state: RootState) => state.establishment;

const isReadyForRedirection = createSelector(
  establishmentState,
  (establishment) => establishment.isReadyForRedirection,
);

const isLoading = createSelector(
  establishmentState,
  (establishment) => establishment.isLoading,
);

const formEstablishment = createSelector(
  establishmentState,
  (establishment) => establishment.formEstablishment,
);

export const establishmentSelectors = {
  formEstablishment,
  isLoading,
  isReadyForRedirection,
};

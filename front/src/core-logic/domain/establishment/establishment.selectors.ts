import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const establishmentState = (state: RootState) => state.establishment;

const isLoading = createSelector(
  establishmentState,
  (establishment) => establishment.isLoading,
);

const formEstablishment = createSelector(
  establishmentState,
  (establishment) => establishment.formEstablishment,
);

const establishmentNameAndAdmins = createSelector(
  establishmentState,
  (establishment) => establishment.establishmentNameAndAdmins,
);

export const establishmentSelectors = {
  formEstablishment,
  isLoading,
  establishmentNameAndAdmins,
};

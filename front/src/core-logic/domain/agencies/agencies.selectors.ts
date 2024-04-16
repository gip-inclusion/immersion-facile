import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const agencies = createRootSelector((state) => state.agencies);

const feedback = createSelector(agencies, ({ feedback }) => feedback);
const isLoading = createSelector(agencies, ({ isLoading }) => isLoading);
const details = createSelector(agencies, ({ details }) => details);
const options = createSelector(agencies, ({ options }) => options);

export const agenciesSelectors = {
  agencies,
  feedback,
  details,
  isLoading,
  options,
};

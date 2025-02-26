import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const remindSignatoriesState = ({ remindSignatories }: RootState) =>
  remindSignatories;

export const remindSignatoriesSelectors = {
  isLoading: createSelector(
    remindSignatoriesState,
    ({ isLoading }) => isLoading,
  ),
};

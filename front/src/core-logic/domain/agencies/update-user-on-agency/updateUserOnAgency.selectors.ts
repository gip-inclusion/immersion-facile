import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const updateUserOnAgencyState = ({ agency }: RootState) =>
  agency.updateUserOnAgency;

export const updateUserOnAgencySelectors = {
  isLoading: createSelector(
    updateUserOnAgencyState,
    ({ isLoading }) => isLoading,
  ),
};

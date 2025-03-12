import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const removeUserFromAgencyState = ({ agency }: RootState) =>
  agency.removeUserFromAgency;

export const removeUserFromAgencySelectors = {
  isLoading: createSelector(
    removeUserFromAgencyState,
    ({ isLoading }) => isLoading,
  ),
};

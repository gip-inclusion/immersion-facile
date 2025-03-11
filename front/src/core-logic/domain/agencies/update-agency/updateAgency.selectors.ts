import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const updateAgencyState = ({ agency }: RootState) => agency.updateAgency;

export const updateAgencySelectors = {
  isLoading: createSelector(updateAgencyState, ({ isLoading }) => isLoading),
};

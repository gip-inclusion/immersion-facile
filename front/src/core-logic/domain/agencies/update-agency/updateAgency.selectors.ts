import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const updateAgencyState = ({ agency }: RootState) => agency.updateAgency;

export const updateAgencySelectors = {
  isLoading: createSelector(updateAgencyState, ({ isLoading }) => isLoading),
};

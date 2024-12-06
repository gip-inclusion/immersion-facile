import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const createUserOnAgencyState = ({ agency }: RootState) =>
  agency.createUserOnAgency;

export const createUserOnAgencySelectors = {
  isLoading: createSelector(
    createUserOnAgencyState,
    ({ isLoading }) => isLoading,
  ),
};

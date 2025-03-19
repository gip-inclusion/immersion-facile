import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const transferConventionToAgencyState = ({
  transferConventionToAgency,
}: RootState) => transferConventionToAgency;

export const transferConventionToAgencySelectors = {
  isLoading: createSelector(
    transferConventionToAgencyState,
    ({ isLoading }) => isLoading,
  ),
};

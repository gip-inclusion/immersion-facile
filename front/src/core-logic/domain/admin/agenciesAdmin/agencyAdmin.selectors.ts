import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "src/core-logic/storeConfig/store";

const agencyState = ({ admin }: RootState) => admin.agencyAdmin;

export const agencyAdminSelectors = {
  agencyState,
  agencyNeedingReview: createSelector(
    agencyState,
    ({ agencyNeedingReview }) => agencyNeedingReview,
  ),
  feedback: createSelector(agencyState, ({ feedback }) => feedback),
};

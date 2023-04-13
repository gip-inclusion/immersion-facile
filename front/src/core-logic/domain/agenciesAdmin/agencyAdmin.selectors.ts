import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const agencyState = ({ admin }: RootState) => admin.agencyAdmin;

export const agencyAdminSelectors = {
  agencyState,
  agency: createSelector(agencyState, ({ agency }) => agency),
  agencyNeedingReview: createSelector(
    agencyState,
    ({ agencyNeedingReview }) => agencyNeedingReview,
  ),
  feedback: createSelector(agencyState, ({ feedback }) => feedback),
};

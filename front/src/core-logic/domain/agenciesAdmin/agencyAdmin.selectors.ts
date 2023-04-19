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
  usersNeedingReview: createSelector(
    agencyState,
    ({ usersNeedingReview }) => usersNeedingReview,
  ),
  agenciesNeedingReviewForUser: createSelector(
    agencyState,
    ({ agenciesNeedingReviewForUser }) => agenciesNeedingReviewForUser,
  ),
  feedback: createSelector(agencyState, ({ feedback }) => feedback),
};

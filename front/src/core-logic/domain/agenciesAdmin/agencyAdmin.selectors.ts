import { createSelector } from "@reduxjs/toolkit";
import { values } from "ramda";
import { AuthenticatedUser } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

const agencyState = ({ admin }: RootState) => admin.agencyAdmin;

const selectedUserId = createSelector(
  agencyState,
  ({ selectedUserId }) => selectedUserId,
);

const inclusionConnectedUsersNeedingReview = createSelector(
  agencyState,
  ({ inclusionConnectedUsersNeedingReview }) =>
    inclusionConnectedUsersNeedingReview,
);

const agenciesNeedingReviewForSelectedUser = createSelector(
  inclusionConnectedUsersNeedingReview,
  selectedUserId,
  (usersNeedingReview, selectedUserId) => {
    if (!selectedUserId) return [];
    const inclusionConnectedUser = usersNeedingReview[selectedUserId];
    if (!inclusionConnectedUser) return [];
    return values(inclusionConnectedUser.agencyRights).filter(
      ({ role }) => role === "toReview",
    );
  },
);

const usersNeedingReview = createSelector(
  inclusionConnectedUsersNeedingReview,
  (normalizedUsers): AuthenticatedUser[] =>
    values(normalizedUsers).map(
      ({ agencyRights, dashboardUrl, ...user }) => user,
    ),
);

export const agencyAdminSelectors = {
  agencyState,
  agency: createSelector(agencyState, ({ agency }) => agency),
  usersNeedingReview,
  selectedUserId,
  agenciesNeedingReviewForSelectedUser,
  agencyNeedingReview: createSelector(
    agencyState,
    ({ agencyNeedingReview }) => agencyNeedingReview,
  ),
  feedback: createSelector(agencyState, ({ feedback }) => feedback),
};

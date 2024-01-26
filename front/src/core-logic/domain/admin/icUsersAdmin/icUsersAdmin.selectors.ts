import { createSelector } from "@reduxjs/toolkit";
import { values } from "ramda";
import { AuthenticatedUser } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

const icUsersAdminState = ({ admin }: RootState) =>
  admin.inclusionConnectedUsersAdmin;

const selectedUserId = createSelector(
  icUsersAdminState,
  ({ selectedUserId }) => selectedUserId,
);

const icUsersNeedingReviewSelector = createSelector(
  icUsersAdminState,
  ({ icUsersNeedingReview }) => icUsersNeedingReview,
);

const agenciesNeedingReviewForSelectedUser = createSelector(
  icUsersNeedingReviewSelector,
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

const icUsersNeedingReview = createSelector(
  icUsersNeedingReviewSelector,
  (normalizedUsers): AuthenticatedUser[] =>
    values(normalizedUsers)
      .filter((user) =>
        values(user.agencyRights).some((right) => right.role === "toReview"),
      )
      .map(
        ({
          agencyRights,
          agencyDashboardUrl,
          establishmentDashboards,
          ...user
        }) => user,
      ),
);

export const icUsersAdminSelectors = {
  icUsersNeedingReview,
  selectedUserId,
  agenciesNeedingReviewForSelectedUser,
  feedback: createSelector(icUsersAdminState, ({ feedback }) => feedback),
};

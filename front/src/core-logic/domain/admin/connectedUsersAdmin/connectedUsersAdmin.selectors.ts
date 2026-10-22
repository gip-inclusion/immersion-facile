import { createSelector } from "@reduxjs/toolkit";
import { values } from "ramda";
import { type AgencyUserForListing, hasAllowedRole } from "shared";
import type { RootState } from "src/core-logic/storeConfig/store";

const connectedUsersAdminState = ({ admin }: RootState) =>
  admin.connectedUsersAdmin;

const selectedUser = createSelector(
  connectedUsersAdminState,
  ({ selectedUser }) => selectedUser,
);

const connectedUsersNeedingReviewSelector = createSelector(
  connectedUsersAdminState,
  ({ connectedUsersNeedingReview }) => connectedUsersNeedingReview,
);

const agencyUsers = createSelector(
  connectedUsersAdminState,
  ({ agencyUsers }) => agencyUsers,
);

const isUpdatingConnectedUserAgency = createSelector(
  connectedUsersAdminState,
  ({ isUpdatingConnectedUserAgency }) => isUpdatingConnectedUserAgency,
);

const isUpdatingUserPreventToDelete = createSelector(
  connectedUsersAdminState,
  ({ isUpdatingUserPreventToDelete }) => isUpdatingUserPreventToDelete,
);

const agenciesNeedingReviewForSelectedUser = createSelector(
  connectedUsersNeedingReviewSelector,
  selectedUser,
  (usersNeedingReview, selectedUser) => {
    if (!selectedUser) return [];
    const inclusionConnectedUser = usersNeedingReview[selectedUser.id];
    if (!inclusionConnectedUser) return [];
    return values(inclusionConnectedUser.agencyRightsByAgencyId).filter(
      ({ roles }) =>
        hasAllowedRole({
          allowedRoles: ["to-review"],
          candidateRoles: roles,
        }),
    );
  },
);

const connectedUsersNeedingReview = createSelector(
  connectedUsersNeedingReviewSelector,
  (users): AgencyUserForListing[] =>
    values(users).filter((user) =>
      values(user.agencyRightsByAgencyId).some((right) =>
        hasAllowedRole({
          allowedRoles: ["to-review"],
          candidateRoles: right.roles,
        }),
      ),
    ),
);

export const connectedUsersAdminSelectors = {
  connectedUsersNeedingReview,
  selectedUser,
  agenciesNeedingReviewForSelectedUser,
  feedback: createSelector(
    connectedUsersAdminState,
    ({ feedback }) => feedback,
  ),
  agencyUsers,
  isUpdatingConnectedUserAgency,
  isUpdatingUserPreventToDelete,
};

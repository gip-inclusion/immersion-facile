import { createSelector } from "@reduxjs/toolkit";
import { values } from "ramda";
import { User } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

const icUsersAdminState = ({ admin }: RootState) =>
  admin.inclusionConnectedUsersAdmin;

const selectedUser = createSelector(
  icUsersAdminState,
  ({ selectedUser }) => selectedUser,
);

const icUsersNeedingReviewSelector = createSelector(
  icUsersAdminState,
  ({ icUsersNeedingReview }) => icUsersNeedingReview,
);

const agencyUsers = createSelector(
  icUsersAdminState,
  ({ agencyUsers }) => agencyUsers,
);

const isUpdatingIcUserAgency = createSelector(
  icUsersAdminState,
  ({ isUpdatingIcUserAgency }) => isUpdatingIcUserAgency,
);

const agenciesNeedingReviewForSelectedUser = createSelector(
  icUsersNeedingReviewSelector,
  selectedUser,
  (usersNeedingReview, selectedUser) => {
    if (!selectedUser) return [];
    const inclusionConnectedUser = usersNeedingReview[selectedUser.id];
    if (!inclusionConnectedUser) return [];
    return values(inclusionConnectedUser.agencyRights).filter(({ roles }) =>
      roles.includes("to-review"),
    );
  },
);

const icUsersNeedingReview = createSelector(
  icUsersNeedingReviewSelector,
  (normalizedUsers): User[] =>
    values(normalizedUsers)
      .filter((user) =>
        values(user.agencyRights).some((right) =>
          right.roles.includes("to-review"),
        ),
      )
      .map(
        ({
          agencyRights: _1,
          dashboards: { agencies: _2, establishments: _3 },
          ...user
        }) => user,
      ),
);

export const icUsersAdminSelectors = {
  icUsersNeedingReview,
  selectedUser,
  agenciesNeedingReviewForSelectedUser,
  feedback: createSelector(icUsersAdminState, ({ feedback }) => feedback),
  agencyUsers,
  isUpdatingIcUserAgency,
};

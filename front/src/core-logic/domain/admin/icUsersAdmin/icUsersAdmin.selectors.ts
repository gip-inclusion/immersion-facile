import { createSelector } from "@reduxjs/toolkit";
import { values } from "ramda";
import { User } from "shared";
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

const agencyUsers = createSelector(
  icUsersAdminState,
  ({ agencyUsers }) => agencyUsers,
);

const agenciesNeedingReviewForSelectedUser = createSelector(
  icUsersNeedingReviewSelector,
  selectedUserId,
  (usersNeedingReview, selectedUserId) => {
    if (!selectedUserId) return [];
    const inclusionConnectedUser = usersNeedingReview[selectedUserId];
    if (!inclusionConnectedUser) return [];
    return values(inclusionConnectedUser.agencyRights).filter(({ roles }) =>
      roles.includes("toReview"),
    );
  },
);

const icUsersNeedingReview = createSelector(
  icUsersNeedingReviewSelector,
  (normalizedUsers): User[] =>
    values(normalizedUsers)
      .filter((user) =>
        values(user.agencyRights).some((right) =>
          right.roles.includes("toReview"),
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
  selectedUserId,
  agenciesNeedingReviewForSelectedUser,
  feedback: createSelector(icUsersAdminState, ({ feedback }) => feedback),
  agencyUsers,
};

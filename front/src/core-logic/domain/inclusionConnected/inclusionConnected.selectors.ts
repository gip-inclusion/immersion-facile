import { createSelector } from "@reduxjs/toolkit";
import { fetchedConventionSelector } from "src/core-logic/domain/convention/convention.selectors";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const inclusionConnectedState = createRootSelector(
  (state) => state.inclusionConnected,
);

const isLoading = createSelector(
  inclusionConnectedState,
  (state) => state.isLoading,
);

const currentUser = createSelector(
  inclusionConnectedState,
  (state) => state.currentUser,
);

const feedback = createSelector(
  inclusionConnectedState,
  (state) => state.feedback,
);

const agencyRoleForFetchedConvention = createSelector(
  currentUser,
  fetchedConventionSelector,
  (icUser, convention) => {
    if (!convention || !icUser) return null;
    const agencyRight = icUser.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === convention.agencyId,
    );
    if (!agencyRight) return null;
    if (agencyRight.role === "toReview") return null;
    return agencyRight.role;
  },
);

export const inclusionConnectedSelectors = {
  isLoading,
  currentUser,
  feedback,
  agencyRoleForFetchedConvention,
};

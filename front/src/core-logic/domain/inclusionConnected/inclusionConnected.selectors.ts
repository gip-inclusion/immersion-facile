import { createSelector } from "@reduxjs/toolkit";
import { getUserRoleForAccessingConvention } from "shared";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
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
  conventionSelectors.convention,
  (icUser, convention) =>
    convention && icUser
      ? getUserRoleForAccessingConvention(convention, icUser)
      : null,
);

export const inclusionConnectedSelectors = {
  isLoading,
  currentUser,
  feedback,
  agencyRoleForFetchedConvention,
};

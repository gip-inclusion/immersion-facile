import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const agencyDashboardState = ({ dashboards }: RootState) =>
  dashboards.agencyDashboard;

export const agencyDashboardSelectors = {
  agencyDashboardState,
  agency: createSelector(agencyDashboardState, ({ agency }) => agency),
  agencyUsers: createSelector(
    agencyDashboardState,
    ({ agencyUsers }) => agencyUsers,
  ),
};

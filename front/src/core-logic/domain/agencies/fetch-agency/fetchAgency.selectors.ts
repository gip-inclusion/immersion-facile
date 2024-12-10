import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const fetchAgencyState = ({ agency }: RootState) => agency.fetchAgency;

export const fetchAgencySelectors = {
  fetchAgencyState,
  agency: createSelector(fetchAgencyState, ({ agency }) => agency),
  agencyUsers: createSelector(
    fetchAgencyState,
    ({ agencyUsers }) => agencyUsers,
  ),
};

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const agencyState = ({ admin }: RootState) => admin.agencyAdmin;

export const agencyAdminSelectors = {
  agencyState,
  agency: createSelector(agencyState, ({ agency }) => agency),
  feedback: createSelector(agencyState, ({ feedback }) => feedback),
  selectedAgencyId: createSelector(
    agencyState,
    ({ selectedAgencyId }) => selectedAgencyId,
  ),
};

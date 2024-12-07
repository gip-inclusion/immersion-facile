import { RootState } from "src/core-logic/storeConfig/store";

import { createUserOnAgencyInitialState } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";
import { fetchAgencyInitialState } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import { removeUserFromAgencyInitialState } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateAgencyInitialState } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { updateUserOnAgencyInitialState } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";

type AgencyState = RootState["agency"];

export const agenciesPreloadedState = (
  state: Partial<AgencyState>,
): AgencyState => ({
  fetchAgency: fetchAgencyInitialState,
  updateUserOnAgency: updateUserOnAgencyInitialState,
  updateAgency: updateAgencyInitialState,
  createUserOnAgency: createUserOnAgencyInitialState,
  removeUserFromAgency: removeUserFromAgencyInitialState,
  ...state,
});

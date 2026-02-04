import { closeAgencyAndTransfertConventionsInitialState } from "src/core-logic/domain/agencies/close-agency-and-transfert-conventions/closeAgencyAndTransfertConventions.slice";
import { createUserOnAgencyInitialState } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";
import { fetchAgencyInitialState } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import { removeUserFromAgencyInitialState } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateAgencyInitialState } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { updateUserOnAgencyInitialState } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import type { RootState } from "src/core-logic/storeConfig/store";

type AgencyState = RootState["agency"];

export const agenciesPreloadedState = (
  state: Partial<AgencyState>,
): AgencyState => ({
  closeAgencyAndTransfertConventions:
    closeAgencyAndTransfertConventionsInitialState,
  fetchAgency: fetchAgencyInitialState,
  updateUserOnAgency: updateUserOnAgencyInitialState,
  updateAgency: updateAgencyInitialState,
  createUserOnAgency: createUserOnAgencyInitialState,
  removeUserFromAgency: removeUserFromAgencyInitialState,
  ...state,
});

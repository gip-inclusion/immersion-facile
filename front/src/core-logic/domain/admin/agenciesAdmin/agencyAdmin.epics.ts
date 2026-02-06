import type { PayloadAction } from "@reduxjs/toolkit";
import { debounceTime, distinctUntilChanged, filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { allAgencyStatuses, looksLikeSiret } from "shared";

import { fetchAgencySlice } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";

import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { closeAgencyAndTransferConventionsSlice } from "../../agencies/close-agency-and-transfert-conventions/closeAgencyAndTransferConventions.slice";
import type { ConnectedUsersAdminAction } from "../connectedUsersAdmin/connectedUsersAdmin.epics";
import { connectedUsersAdminSlice } from "../connectedUsersAdmin/connectedUsersAdmin.slice";
import { agencyAdminSlice } from "./agencyAdmin.slice";

export type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;
type CloseAgencyAndTransfertConventionsAction = ActionOfSlice<
  typeof closeAgencyAndTransferConventionsSlice
>;

type AgencyEpic = AppEpic<AgencyAction | { type: "do-nothing" }>;

const agencyAdminGetByNameEpic: AgencyEpic = (
  action$,
  _state$,
  { agencyGateway, scheduler },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setAgencySearchQuery.match),
    debounceTime(400, scheduler),
    distinctUntilChanged(),
    switchMap((action: PayloadAction<string>) =>
      agencyGateway.listAgencyOptionsByFilter$({
        status: [...allAgencyStatuses],
        [looksLikeSiret(action.payload) ? "siret" : "nameIncludes"]:
          action.payload,
      }),
    ),
    map(agencyAdminSlice.actions.setAgencyOptions),
  );

const fetchAgencyOnIcUserUpdatedEpic: AppEpic<
  | ConnectedUsersAdminAction
  | AgencyAction
  | CloseAgencyAndTransfertConventionsAction
> = (action$) =>
  action$.pipe(
    filter(
      (action) =>
        connectedUsersAdminSlice.actions.updateUserOnAgencySucceeded.match(
          action,
        ) ||
        connectedUsersAdminSlice.actions.removeUserFromAgencySucceeded.match(
          action,
        ) ||
        connectedUsersAdminSlice.actions.createUserOnAgencySucceeded.match(
          action,
        ) ||
        closeAgencyAndTransferConventionsSlice.actions.closeAgencyAndTransferConventionsSucceeded.match(
          action,
        ),
    ),
    map((action) =>
      fetchAgencySlice.actions.fetchAgencyRequested({
        agencyId: action.payload.agencyId,
        feedbackTopic: "agency-admin",
      }),
    ),
  );

export const agenciesAdminEpics = [
  agencyAdminGetByNameEpic,
  fetchAgencyOnIcUserUpdatedEpic,
];

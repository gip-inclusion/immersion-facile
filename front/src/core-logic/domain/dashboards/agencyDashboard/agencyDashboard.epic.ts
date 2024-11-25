import { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import { agencyDashboardSlice } from "src/core-logic/domain/dashboards/agencyDashboard/agencyDashboard.slice";

import { AgencyId } from "shared";
import { normalizeUsers } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.epics";

export type AgencyDashboardAction = ActionOfSlice<typeof agencyDashboardSlice>;

type AgencyDashboardEpic = AppEpic<
  AgencyDashboardAction | { type: "do-nothing" }
>;

const getAgencyEpic: AgencyDashboardEpic = (action$, state$, dependencies) =>
  action$.pipe(
    filter(agencyDashboardSlice.actions.fetchAgencyRequested.match),
    switchMap((action: PayloadAction<AgencyId>) =>
      dependencies.agencyGateway
        .getAgencyForDashboardById$(action.payload, getAdminToken(state$.value))
        .pipe(
          map((agency) =>
            agencyDashboardSlice.actions.fetchAgencySucceeded(agency),
          ),
        ),
    ),
    catchEpicError((error: Error) =>
      agencyDashboardSlice.actions.fetchAgencyFailed(error.message),
    ),
  );

const getAgencyUsersEpic: AgencyDashboardEpic = (
  action$,
  state$,
  dependencies,
) =>
  action$.pipe(
    filter(agencyDashboardSlice.actions.fetchAgencyUsersRequested.match),
    switchMap((action: PayloadAction<AgencyId>) =>
      dependencies.agencyGateway
        .getAgencyUsers$(action.payload, getAdminToken(state$.value))
        .pipe(),
    ),
    map(normalizeUsers),
    map((users) =>
      agencyDashboardSlice.actions.fetchAgencyUsersSucceeded(users),
    ),
    catchEpicError((error: Error) =>
      agencyDashboardSlice.actions.fetchAgencyUsersFailed(error.message),
    ),
  );

export const agenciesDashboardEpics = [getAgencyEpic, getAgencyUsersEpic];

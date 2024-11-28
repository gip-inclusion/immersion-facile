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

import { AgencyId, AgencyRight } from "shared";
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

const updateAgencyEpic: AgencyDashboardEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyDashboardSlice.actions.updateAgencyRequested.match),
    switchMap(({ payload }) =>
      agencyGateway
        .updateAgencyFromDashboard$(payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            agencyDashboardSlice.actions.updateAgencySucceeded(payload),
          ),
        ),
    ),
    catchEpicError((error: Error) =>
      agencyDashboardSlice.actions.updateAgencyFailed(error.message),
    ),
  );

const createUserOnAgencyEpic: AgencyDashboardEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyDashboardSlice.actions.createUserOnAgencyRequested.match),
    switchMap((action) =>
      agencyGateway
        .createUserForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map((user) =>
            agencyDashboardSlice.actions.createUserOnAgencySucceeded({
              icUser: {
                ...user,
                agencyRights: user.agencyRights.reduce(
                  (agenciesAcc, agencyRight) => ({
                    ...agenciesAcc,
                    [agencyRight.agency.id]: agencyRight,
                  }),
                  {} as Record<AgencyId, AgencyRight>,
                ),
              },
              agencyId: action.payload.agencyId,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            agencyDashboardSlice.actions.createUserOnAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const updateUserOnAgencyEpic: AgencyDashboardEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyDashboardSlice.actions.updateUserOnAgencyRequested.match),
    switchMap((action) =>
      agencyGateway
        .updateUserRoleForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            agencyDashboardSlice.actions.updateUserOnAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            agencyDashboardSlice.actions.updateUserOnAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const removeAgencyUserEpic: AgencyDashboardEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyDashboardSlice.actions.removeUserFromAgencyRequested.match),
    switchMap((action) =>
      agencyGateway
        .removeUserFromAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            agencyDashboardSlice.actions.removeUserFromAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            agencyDashboardSlice.actions.removeUserFromAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const agenciesDashboardEpics = [
  getAgencyEpic,
  getAgencyUsersEpic,
  updateAgencyEpic,
  createUserOnAgencyEpic,
  updateUserOnAgencyEpic,
  removeAgencyUserEpic,
];

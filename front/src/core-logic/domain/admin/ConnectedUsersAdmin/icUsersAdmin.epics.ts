import type { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import type {
  AgencyId,
  AgencyRight,
  ConnectedUser,
  RejectIcUserRoleForAgencyParams,
  UserParamsForAgency,
  WithUserFilters,
} from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import type { AgencyAction } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.epics";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import {
  type ConnectedUsersWithNormalizedAgencyRightsById,
  connectedUsersAdminSlice,
} from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type IcUsersAdminAction = ActionOfSlice<typeof connectedUsersAdminSlice>;
type IcUsersAdminActionEpic = AppEpic<IcUsersAdminAction>;

const fetchInclusionConnectedUsersWithAgencyNeedingReviewEpic: IcUsersAdminActionEpic =
  (action$, state$, { adminGateway }) =>
    action$.pipe(
      filter(
        connectedUsersAdminSlice.actions.fetchConnectedUsersToReviewRequested
          .match,
      ),
      switchMap((action: PayloadAction<WithUserFilters>) =>
        adminGateway.getConnectedUsersToReview$(
          getAdminToken(state$.value),
          action.payload,
        ),
      ),
      map(normalizeUsers),
      map(
        connectedUsersAdminSlice.actions.fetchConnectedUsersToReviewSucceeded,
      ),
      catchEpicError((error) =>
        connectedUsersAdminSlice.actions.fetchConnectedUsersToReviewFailed(
          error?.message,
        ),
      ),
    );

const fetchInclusionConnectedUsersWithAgencyIdEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(connectedUsersAdminSlice.actions.fetchAgencyUsersRequested.match),
    switchMap((action: PayloadAction<WithUserFilters>) =>
      adminGateway.getConnectedUsersToReview$(
        getAdminToken(state$.value),
        action.payload,
      ),
    ),
    map(normalizeUsers),
    map(connectedUsersAdminSlice.actions.fetchAgencyUsersSucceeded),
    catchEpicError((error) =>
      connectedUsersAdminSlice.actions.fetchAgencyUsersFailed(error?.message),
    ),
  );

const registerAgencyToUserEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      connectedUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested
        .match,
    ),
    switchMap((action: PayloadAction<UserParamsForAgency>) =>
      adminGateway
        .updateUserRoleForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            connectedUsersAdminSlice.actions.registerAgencyWithRoleToUserSucceeded(
              action.payload,
            ),
          ),
        ),
    ),
    catchEpicError((error) =>
      connectedUsersAdminSlice.actions.registerAgencyWithRoleToUserFailed(
        error?.message,
      ),
    ),
  );

const rejectAgencyToUserEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      connectedUsersAdminSlice.actions.rejectAgencyWithRoleToUserRequested
        .match,
    ),
    switchMap((action: PayloadAction<RejectIcUserRoleForAgencyParams>) =>
      adminGateway
        .rejectUserForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            connectedUsersAdminSlice.actions.rejectAgencyWithRoleToUserSucceeded(
              action.payload,
            ),
          ),
        ),
    ),
    catchEpicError((error) =>
      connectedUsersAdminSlice.actions.rejectAgencyWithRoleToUserFailed(
        error?.message,
      ),
    ),
  );

const createUserOnAgencyEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(connectedUsersAdminSlice.actions.createUserOnAgencyRequested.match),
    switchMap((action) =>
      adminGateway
        .createUserForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map((user) =>
            connectedUsersAdminSlice.actions.createUserOnAgencySucceeded({
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
            connectedUsersAdminSlice.actions.createUserOnAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const updateUserOnAgencyEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(connectedUsersAdminSlice.actions.updateUserOnAgencyRequested.match),
    switchMap((action) =>
      adminGateway
        .updateUserRoleForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            connectedUsersAdminSlice.actions.updateUserOnAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            connectedUsersAdminSlice.actions.updateUserOnAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const removeAgencyUserRequestedEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      connectedUsersAdminSlice.actions.removeUserFromAgencyRequested.match,
    ),
    switchMap((action) =>
      adminGateway
        .removeUserFromAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            connectedUsersAdminSlice.actions.removeUserFromAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            connectedUsersAdminSlice.actions.removeUserFromAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const fetchInclusionConnectedUserOnAgencyUpdateEpic: AppEpic<
  IcUsersAdminAction | AgencyAction
> = (action$) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.updateAgencySucceeded.match),
    map((action) =>
      connectedUsersAdminSlice.actions.fetchAgencyUsersRequested({
        agencyId: action.payload.id,
      }),
    ),
  );

export const normalizeUsers = (
  users: ConnectedUser[],
): ConnectedUsersWithNormalizedAgencyRightsById =>
  users.reduce(
    (acc, user) => ({
      ...acc,
      [user.id]: {
        ...user,
        agencyRights: user.agencyRights.reduce(
          (agenciesAcc, agencyRight) => ({
            ...agenciesAcc,
            [agencyRight.agency.id]: agencyRight,
          }),
          {} as Record<AgencyId, AgencyRight>,
        ),
      },
    }),
    {} as ConnectedUsersWithNormalizedAgencyRightsById,
  );

export const connectedUsersAdminEpics = [
  fetchInclusionConnectedUsersWithAgencyNeedingReviewEpic,
  registerAgencyToUserEpic,
  rejectAgencyToUserEpic,
  fetchInclusionConnectedUsersWithAgencyIdEpic,
  updateUserOnAgencyEpic,
  fetchInclusionConnectedUserOnAgencyUpdateEpic,
  createUserOnAgencyEpic,
  removeAgencyUserRequestedEpic,
];

import { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  UserParamsForAgency,
  WithUserFilters,
} from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { type AgencyAction } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.epics";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import {
  NormalizedIcUserById,
  icUsersAdminSlice,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type IcUsersAdminAction = ActionOfSlice<typeof icUsersAdminSlice>;
type IcUsersAdminActionEpic = AppEpic<IcUsersAdminAction>;

const fetchInclusionConnectedUsersWithAgencyNeedingReviewEpic: IcUsersAdminActionEpic =
  (action$, state$, { adminGateway }) =>
    action$.pipe(
      filter(
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested
          .match,
      ),
      switchMap((action: PayloadAction<WithUserFilters>) =>
        adminGateway.getInclusionConnectedUsersToReview$(
          getAdminToken(state$.value),
          action.payload,
        ),
      ),
      map(normalizeUsers),
      map(
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewSucceeded,
      ),
      catchEpicError((error) =>
        icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewFailed(
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
    filter(icUsersAdminSlice.actions.fetchAgencyUsersRequested.match),
    switchMap((action: PayloadAction<WithUserFilters>) =>
      adminGateway.getInclusionConnectedUsersToReview$(
        getAdminToken(state$.value),
        action.payload,
      ),
    ),
    map(normalizeUsers),
    map(icUsersAdminSlice.actions.fetchAgencyUsersSucceeded),
    catchEpicError((error) =>
      icUsersAdminSlice.actions.fetchAgencyUsersFailed(error?.message),
    ),
  );

const registerAgencyToUserEpic: IcUsersAdminActionEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested.match,
    ),
    switchMap((action: PayloadAction<UserParamsForAgency>) =>
      adminGateway
        .updateUserRoleForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            icUsersAdminSlice.actions.registerAgencyWithRoleToUserSucceeded(
              action.payload,
            ),
          ),
        ),
    ),
    catchEpicError((error) =>
      icUsersAdminSlice.actions.registerAgencyWithRoleToUserFailed(
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
    filter(icUsersAdminSlice.actions.rejectAgencyWithRoleToUserRequested.match),
    switchMap((action: PayloadAction<RejectIcUserRoleForAgencyParams>) =>
      adminGateway
        .rejectUserForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            icUsersAdminSlice.actions.rejectAgencyWithRoleToUserSucceeded(
              action.payload,
            ),
          ),
        ),
    ),
    catchEpicError((error) =>
      icUsersAdminSlice.actions.rejectAgencyWithRoleToUserFailed(
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
    filter(icUsersAdminSlice.actions.createUserOnAgencyRequested.match),
    switchMap((action) =>
      adminGateway
        .createUserForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map((user) =>
            icUsersAdminSlice.actions.createUserOnAgencySucceeded({
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
            icUsersAdminSlice.actions.createUserOnAgencyFailed({
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
    filter(icUsersAdminSlice.actions.updateUserOnAgencyRequested.match),
    switchMap((action) =>
      adminGateway
        .updateUserRoleForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            icUsersAdminSlice.actions.updateUserOnAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            icUsersAdminSlice.actions.updateUserOnAgencyFailed({
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
    filter(icUsersAdminSlice.actions.removeUserFromAgencyRequested.match),
    switchMap((action) =>
      adminGateway
        .removeUserFromAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            icUsersAdminSlice.actions.removeUserFromAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            icUsersAdminSlice.actions.removeUserFromAgencyFailed({
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
      icUsersAdminSlice.actions.fetchAgencyUsersRequested({
        agencyId: action.payload.id,
      }),
    ),
  );

export const normalizeUsers = (
  users: InclusionConnectedUser[],
): NormalizedIcUserById =>
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
    {} as NormalizedIcUserById,
  );

export const icUsersAdminEpics = [
  fetchInclusionConnectedUsersWithAgencyNeedingReviewEpic,
  registerAgencyToUserEpic,
  rejectAgencyToUserEpic,
  fetchInclusionConnectedUsersWithAgencyIdEpic,
  updateUserOnAgencyEpic,
  fetchInclusionConnectedUserOnAgencyUpdateEpic,
  createUserOnAgencyEpic,
  removeAgencyUserRequestedEpic,
];

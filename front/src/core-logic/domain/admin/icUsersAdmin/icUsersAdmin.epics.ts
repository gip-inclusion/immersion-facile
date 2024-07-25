import { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  AgencyId,
  AgencyRight,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  RejectIcUserRoleForAgencyParams,
  WithUserFilters,
} from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import {
  NormalizedIcUserById,
  icUsersAdminSlice,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { PayloadActionWithFeedbackTopic } from "../../feedback/feedback.slice";

type IcUsersAdminAction = ActionOfSlice<typeof icUsersAdminSlice>;
const fetchInclusionConnectedUsersWithAgencyNeedingReviewEpic: AppEpic<
  IcUsersAdminAction
> = (action$, state$, { adminGateway }) =>
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

const fetchInclusionConnectedUsersWithAgencyIdEpic: AppEpic<
  IcUsersAdminAction
> = (action$, state$, { adminGateway }) =>
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

const registerAgencyToUserEpic: AppEpic<IcUsersAdminAction> = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested.match,
    ),
    switchMap((action: PayloadAction<IcUserRoleForAgencyParams>) =>
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

const rejectAgencyToUserEpic: AppEpic<IcUsersAdminAction> = (
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

const updateUserOnAgencyEpic: AppEpic<IcUsersAdminAction> = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(icUsersAdminSlice.actions.updateUserOnAgencyRequested.match),
    switchMap(
      (action: PayloadActionWithFeedbackTopic<IcUserRoleForAgencyParams>) =>
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

const normalizeUsers = (
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
];

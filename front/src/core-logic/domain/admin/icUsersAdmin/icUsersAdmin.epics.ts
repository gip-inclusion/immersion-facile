import { PayloadAction } from "@reduxjs/toolkit";
import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  RegisterAgencyWithRoleToUserDto,
} from "shared";
import {
  icUsersAdminSlice,
  NormalizedIcUserById,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type IcUsersAdminAction = ActionOfSlice<typeof icUsersAdminSlice>;
const fetchInclusionConnectedUsersWithAgencyNeedingReviewEpic: AppEpic<
  IcUsersAdminAction
> = (action$, state$, { adminGateway }) =>
  action$.pipe(
    filter(
      icUsersAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested
        .match,
    ),
    switchMap((_action) =>
      adminGateway.getInclusionConnectedUsersToReview$(
        state$.value.auth.federatedIdentityWithUser?.token ?? "",
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

const registerAgencyToUserEpic: AppEpic<IcUsersAdminAction> = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      icUsersAdminSlice.actions.registerAgencyWithRoleToUserRequested.match,
    ),
    switchMap((action: PayloadAction<RegisterAgencyWithRoleToUserDto>) =>
      adminGateway
        .updateAgencyRoleForUser$(
          action.payload,
          state$.value.auth.federatedIdentityWithUser?.token ?? "",
        )
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
];

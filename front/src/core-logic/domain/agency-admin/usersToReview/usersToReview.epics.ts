import { values } from "ramda";
import { filter, map, switchMap } from "rxjs";
import { hasAllowedRole } from "shared";
import { getConnectedUserJwt } from "src/core-logic/domain/admin/admin.helpers";
import { usersToReviewSlice } from "src/core-logic/domain/agency-admin/usersToReview/usersToReview.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type UsersInReviewAction = ActionOfSlice<typeof usersToReviewSlice>;
type UsersInReviewEpic = AppEpic<UsersInReviewAction>;

const getUsersInReviewEpic: UsersInReviewEpic = (
  action$,
  state$,
  dependencies,
) =>
  action$.pipe(
    filter(usersToReviewSlice.actions.fetchUsersToReviewRequested.match),
    switchMap((action) =>
      dependencies.agencyGateway
        .getAgencyUsers$(getConnectedUserJwt(state$.value), {
          agencyIds: action.payload.agencies.map(({ id }) => id),
          agencyRole: "to-review",
        })
        .pipe(
          map((agencyUsers) => ({
            usersToReview: agencyUsers.flatMap((agencyUser) =>
              values(agencyUser.agencyRightsByAgencyId)
                .filter((agencyRight) =>
                  hasAllowedRole({
                    allowedRoles: ["to-review"],
                    candidateRoles: agencyRight.roles,
                  }),
                )
                .map((agencyRight) => ({
                  id: agencyUser.id,
                  email: agencyUser.email,
                  firstName: agencyUser.firstName,
                  lastName: agencyUser.lastName,
                  agency: agencyRight.agency,
                })),
            ),
            feedbackTopic: action.payload.feedbackTopic,
          })),
          map(usersToReviewSlice.actions.fetchUsersToReviewSucceeded),
          catchEpicError((error) =>
            usersToReviewSlice.actions.fetchUsersToReviewFailed({
              errorMessage: error?.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const usersInReviewEpics = [getUsersInReviewEpic];

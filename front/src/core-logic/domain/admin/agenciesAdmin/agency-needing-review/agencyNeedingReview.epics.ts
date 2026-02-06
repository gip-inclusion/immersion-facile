import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyNeedingReviewSlice } from "./agencyNeedingReview.slice";

export type AgencyNeedingReviewAction = ActionOfSlice<
  typeof agencyNeedingReviewSlice
>;

export const fetchAgencyNeedingReviewEpic: AppEpic<
  AgencyNeedingReviewAction | { type: "do-nothing" }
> = (action$, state$, dependencies) =>
  action$.pipe(
    filter(
      agencyNeedingReviewSlice.actions.fetchAgencyNeedingReviewRequested.match,
    ),
    switchMap((action) =>
      dependencies.agencyGateway
        .getAgencyById$(action.payload.agencyId, getAdminToken(state$.value))
        .pipe(
          map((agency) =>
            agencyNeedingReviewSlice.actions.fetchAgencyNeedingReviewSucceeded(
              agency ?? null,
            ),
          ),
          catchEpicError((error: Error) =>
            agencyNeedingReviewSlice.actions.fetchAgencyNeedingReviewFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const updateAgencyNeedingReviewStatusEpic: AppEpic<
  AgencyNeedingReviewAction | { type: "do-nothing" }
> = (action$, state$, { agencyGateway }) =>
  action$.pipe(
    filter(
      agencyNeedingReviewSlice.actions.updateAgencyNeedingReviewStatusRequested
        .match,
    ),
    switchMap(({ payload }) =>
      agencyGateway
        .validateOrRejectAgency$(getAdminToken(state$.value), payload)
        .pipe(
          map(() =>
            agencyNeedingReviewSlice.actions.updateAgencyNeedingReviewStatusSucceeded(
              {
                agencyId: payload.id,
                feedbackTopic: "agency-admin-needing-review",
              },
            ),
          ),
          catchEpicError((error: Error) =>
            agencyNeedingReviewSlice.actions.updateAgencyNeedingReviewStatusFailed(
              {
                errorMessage: error.message,
                feedbackTopic: payload.feedbackTopic,
              },
            ),
          ),
        ),
    ),
  );

export const agencyNeedingReviewEpics = [
  fetchAgencyNeedingReviewEpic,
  updateAgencyNeedingReviewStatusEpic,
];

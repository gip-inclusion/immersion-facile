import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyNeedingReviewSlice } from "./agencyNeedingReview.slice";

export type agencyNeedingReviewAction = ActionOfSlice<
  typeof agencyNeedingReviewSlice
>;

export const fetchAgencyNeedingReviewEpic: AppEpic<
  agencyNeedingReviewAction | { type: "do-nothing" }
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

export const agencyNeedingReviewEpics = [fetchAgencyNeedingReviewEpic];

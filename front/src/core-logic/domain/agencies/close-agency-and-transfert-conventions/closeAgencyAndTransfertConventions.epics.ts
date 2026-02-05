import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { closeAgencyAndTransfertConventionsSlice } from "src/core-logic/domain/agencies/close-agency-and-transfert-conventions/closeAgencyAndTransfertConventions.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type CloseAgencyAndTransfertConventionsAction = ActionOfSlice<
  typeof closeAgencyAndTransfertConventionsSlice
>;

const closeAgencyAndTransfertConventionsEpic: AppEpic<
  CloseAgencyAndTransfertConventionsAction
> = (action$, state$, { agencyGateway }) =>
  action$.pipe(
    filter(
      closeAgencyAndTransfertConventionsSlice.actions
        .closeAgencyAndTransfertConventionsRequested.match,
    ),
    switchMap((action) =>
      agencyGateway
        .closeAgencyAndTransfertConventions$(
          action.payload,
          getAdminToken(state$.value),
        )
        .pipe(
          map(() =>
            closeAgencyAndTransfertConventionsSlice.actions.closeAgencyAndTransfertConventionsSucceeded(
              {
                feedbackTopic: action.payload.feedbackTopic,
                agencyId: action.payload.agencyToCloseId,
              },
            ),
          ),
          catchEpicError((error) =>
            closeAgencyAndTransfertConventionsSlice.actions.closeAgencyAndTransfertConventionsFailed(
              {
                errorMessage: error.message,
                feedbackTopic: action.payload.feedbackTopic,
              },
            ),
          ),
        ),
    ),
  );

export const closeAgencyAndTransfertConventionsEpics = [
  closeAgencyAndTransfertConventionsEpic,
];

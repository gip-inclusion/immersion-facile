import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { closeAgencyAndTransferConventionsSlice } from "src/core-logic/domain/agencies/close-agency-and-transfert-conventions/closeAgencyAndTransferConventions.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type CloseAgencyAndTransfertConventionsAction = ActionOfSlice<
  typeof closeAgencyAndTransferConventionsSlice
>;

const closeAgencyAndTransfertConventionsEpic: AppEpic<
  CloseAgencyAndTransfertConventionsAction
> = (action$, state$, { agencyGateway }) =>
  action$.pipe(
    filter(
      closeAgencyAndTransferConventionsSlice.actions
        .closeAgencyAndTransferConventionsRequested.match,
    ),
    switchMap((action) =>
      agencyGateway
        .closeAgencyAndTransfertConventions$(
          action.payload,
          getAdminToken(state$.value),
        )
        .pipe(
          map(() =>
            closeAgencyAndTransferConventionsSlice.actions.closeAgencyAndTransferConventionsSucceeded(
              {
                feedbackTopic: action.payload.feedbackTopic,
                agencyId: action.payload.agencyToCloseId,
              },
            ),
          ),
          catchEpicError((error) =>
            closeAgencyAndTransferConventionsSlice.actions.closeAgencyAndTransferConventionsFailed(
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

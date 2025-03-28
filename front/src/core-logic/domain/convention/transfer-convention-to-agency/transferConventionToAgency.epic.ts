import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { transferConventionToAgencySlice } from "src/core-logic/domain/convention/transfer-convention-to-agency/transferConventionToAgency.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type TransferConventionToAgencyAction = ActionOfSlice<
  typeof transferConventionToAgencySlice
>;

type TransferConventionToAgencyEpic = AppEpic<
  TransferConventionToAgencyAction | { type: "do-nothing" }
>;

const transferConventionToAgencyEpic: TransferConventionToAgencyEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      transferConventionToAgencySlice.actions
        .transferConventionToAgencyRequested.match,
    ),
    switchMap((action) =>
      conventionGateway
        .transferConventionToAgency$(action.payload, action.payload.jwt)
        .pipe(
          map(() =>
            transferConventionToAgencySlice.actions.transferConventionToAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            transferConventionToAgencySlice.actions.transferConventionToAgencyFailed(
              {
                errorMessage: error.message,
                feedbackTopic: action.payload.feedbackTopic,
              },
            ),
          ),
        ),
    ),
  );

export const transferConventionToAgencyEpics = [transferConventionToAgencyEpic];

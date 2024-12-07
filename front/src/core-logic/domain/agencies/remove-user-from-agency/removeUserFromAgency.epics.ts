import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";

export type RemoveUserFromAgencyAction = ActionOfSlice<
  typeof removeUserFromAgencySlice
>;

type RemoveUserFromAgencyEpic = AppEpic<
  RemoveUserFromAgencyAction | { type: "do-nothing" }
>;

const removeAgencyUserEpic: RemoveUserFromAgencyEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(
      removeUserFromAgencySlice.actions.removeUserFromAgencyRequested.match,
    ),
    switchMap((action) =>
      agencyGateway
        .removeUserFromAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            removeUserFromAgencySlice.actions.removeUserFromAgencySucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            removeUserFromAgencySlice.actions.removeUserFromAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const removeUserFromAgencyEpics = [removeAgencyUserEpic];

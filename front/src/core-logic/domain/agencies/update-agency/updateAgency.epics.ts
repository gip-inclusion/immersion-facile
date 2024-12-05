import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type UpdateAgencyAction = ActionOfSlice<typeof updateAgencySlice>;

type UpdateAgencyEpic = AppEpic<UpdateAgencyAction | { type: "do-nothing" }>;

const updateAgencyEpic: UpdateAgencyEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(updateAgencySlice.actions.updateAgencyRequested.match),
    switchMap((action) =>
      agencyGateway
        .updateAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            updateAgencySlice.actions.updateAgencySucceeded(action.payload),
          ),
          catchEpicError((error: Error) =>
            updateAgencySlice.actions.updateAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const updateAgencyEpics = [updateAgencyEpic];

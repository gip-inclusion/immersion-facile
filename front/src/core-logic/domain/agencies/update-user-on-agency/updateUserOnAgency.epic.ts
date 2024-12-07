import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type UpdateUserOnAgencyAction = ActionOfSlice<typeof updateUserOnAgencySlice>;
type UpdateUserOnAgencyEpic = AppEpic<UpdateUserOnAgencyAction>;

const updateUserAgencyRightEpic: UpdateUserOnAgencyEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested.match,
    ),
    switchMap((action) =>
      agencyGateway
        .updateUserAgencyRight$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(() =>
            updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded({
              ...action.payload,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            updateUserOnAgencySlice.actions.updateUserAgencyRightFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const updateUserOnAgencyEpics = [updateUserAgencyRightEpic];

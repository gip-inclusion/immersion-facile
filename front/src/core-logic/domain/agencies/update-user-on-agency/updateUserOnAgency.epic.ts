import { filter, map, switchMap } from "rxjs";
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
  _state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(
      updateUserOnAgencySlice.actions.updateUserAgencyRightRequested.match,
    ),
    switchMap((action) =>
      agencyGateway
        .updateUserAgencyRight$(action.payload.user, action.payload.jwt)
        .pipe(
          map(() =>
            updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded({
              ...action.payload.user,
              feedbackTopic: "user",
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

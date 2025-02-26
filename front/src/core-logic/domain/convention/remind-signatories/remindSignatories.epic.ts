import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { remindSignatoriesSlice } from "src/core-logic/domain/convention/remind-signatories/remindSignatories.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type RemindSignatoriesAction = ActionOfSlice<
  typeof remindSignatoriesSlice
>;

type RemindSignatoriesEpic = AppEpic<
  RemindSignatoriesAction | { type: "do-nothing" }
>;

const remindSignatoriesEpic: RemindSignatoriesEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(remindSignatoriesSlice.actions.remindSignatoriesRequested.match),
    switchMap((action) =>
      conventionGateway
        .remindSignatories$(action.payload, action.payload.jwt)
        .pipe(
          map(() =>
            remindSignatoriesSlice.actions.remindSignatoriesSucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error) =>
            remindSignatoriesSlice.actions.remindSignatoriesFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const remindSignatoriesEpics = [remindSignatoriesEpic];

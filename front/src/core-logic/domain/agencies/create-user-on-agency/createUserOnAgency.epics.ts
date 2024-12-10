import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import { createUserOnAgencySlice } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";

export type CreateUserOnAgencyAction = ActionOfSlice<
  typeof createUserOnAgencySlice
>;

type CreateUserOnAgencyEpic = AppEpic<
  CreateUserOnAgencyAction | { type: "do-nothing" }
>;

const createUserOnAgencyEpic: CreateUserOnAgencyEpic = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(createUserOnAgencySlice.actions.createUserOnAgencyRequested.match),
    switchMap((action) =>
      agencyGateway
        .createUserForAgency$(action.payload, getAdminToken(state$.value))
        .pipe(
          map((user) =>
            createUserOnAgencySlice.actions.createUserOnAgencySucceeded({
              icUser: {
                ...user,
                agencyRights: user.agencyRights.reduce(
                  (agenciesAcc, agencyRight) => ({
                    ...agenciesAcc,
                    [agencyRight.agency.id]: agencyRight,
                  }),
                  {},
                ),
              },
              agencyId: action.payload.agencyId,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            createUserOnAgencySlice.actions.createUserOnAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const createUserOnAgencyEpics = [createUserOnAgencyEpic];

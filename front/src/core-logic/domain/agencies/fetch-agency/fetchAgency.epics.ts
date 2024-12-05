import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import { WithAgencyId } from "shared";
import { normalizeUsers } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.epics";
import { fetchAgencySlice } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export type FetchAgencyAction = ActionOfSlice<typeof fetchAgencySlice>;

type FetchAgencyEpic = AppEpic<FetchAgencyAction | { type: "do-nothing" }>;

const getAgencyEpic: FetchAgencyEpic = (action$, state$, dependencies) =>
  action$.pipe(
    filter(fetchAgencySlice.actions.fetchAgencyRequested.match),
    switchMap((action: PayloadActionWithFeedbackTopic<WithAgencyId>) =>
      dependencies.agencyGateway
        .getAgencyById$(action.payload.agencyId, getAdminToken(state$.value))
        .pipe(
          map((agency) =>
            fetchAgencySlice.actions.fetchAgencySucceeded(agency),
          ),
          catchEpicError((error: Error) =>
            fetchAgencySlice.actions.fetchAgencyFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

const getAgencyUsersEpic: FetchAgencyEpic = (action$, state$, dependencies) =>
  action$.pipe(
    filter(fetchAgencySlice.actions.fetchAgencyUsersRequested.match),
    switchMap((action: PayloadActionWithFeedbackTopic<WithAgencyId>) =>
      dependencies.agencyGateway
        .getAgencyUsers$(action.payload.agencyId, getAdminToken(state$.value))
        .pipe(
          map(normalizeUsers),
          map((users) =>
            fetchAgencySlice.actions.fetchAgencyUsersSucceeded(users),
          ),
          catchEpicError((error: Error) =>
            fetchAgencySlice.actions.fetchAgencyUsersFailed({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const fetchAgencyEpics = [getAgencyEpic, getAgencyUsersEpic];

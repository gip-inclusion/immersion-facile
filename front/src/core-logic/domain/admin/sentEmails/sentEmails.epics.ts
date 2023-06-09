import { filter, map, switchMap } from "rxjs";
import { sentEmailsSlice } from "src/core-logic/domain/admin/sentEmails/sentEmails.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type SentEmailsAction = ActionOfSlice<typeof sentEmailsSlice>;
type SentEmailEpic = AppEpic<SentEmailsAction>;

const getSentEmail: SentEmailEpic = (action$, state$, { adminGateway }) =>
  action$.pipe(
    filter(sentEmailsSlice.actions.lastSentEmailsRequested.match),
    switchMap(() =>
      adminGateway.getLastNotifications(
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(({ emails }) =>
      sentEmailsSlice.actions.lastSentEmailsSucceeded(emails),
    ),
    catchEpicError((error) =>
      sentEmailsSlice.actions.lastSentEmailsFailed(error.message),
    ),
  );

export const sentEmailsEpics = [getSentEmail];

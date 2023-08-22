import { filter, map, switchMap } from "rxjs";
import { notificationsSlice } from "src/core-logic/domain/admin/notifications/notificationsSlice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type SentEmailsAction = ActionOfSlice<typeof notificationsSlice>;
type SentEmailEpic = AppEpic<SentEmailsAction>;

const getSentEmail: SentEmailEpic = (action$, state$, { adminGateway }) =>
  action$.pipe(
    filter(notificationsSlice.actions.getLastNotificationsRequested.match),
    switchMap(() =>
      adminGateway.getLastNotifications$(
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(notificationsSlice.actions.getLastNotificationsSucceeded),
    catchEpicError((error) =>
      notificationsSlice.actions.getLastNotificationsFailed(error.message),
    ),
  );

export const notificationsEpics = [getSentEmail];

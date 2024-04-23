import { filter, map, switchMap } from "rxjs";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
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
      adminGateway.getLastNotifications$(getAdminToken(state$.value)),
    ),
    map(notificationsSlice.actions.getLastNotificationsSucceeded),
    catchEpicError((error) =>
      notificationsSlice.actions.getLastNotificationsFailed(error.message),
    ),
  );

export const notificationsEpics = [getSentEmail];

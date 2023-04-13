import { filter, map, switchMap } from "rxjs";

import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

type DashboardUrlsAction = ActionOfSlice<typeof dashboardUrlsSlice>;
type DashboardUrlsEpic = AppEpic<DashboardUrlsAction>;

const getConventionDashboardUrl: DashboardUrlsEpic = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(dashboardUrlsSlice.actions.dashboardUrlRequested.match),
    switchMap((action) =>
      adminGateway
        .getDashboardUrl$(
          action.payload,
          state$.value.admin.adminAuth.adminToken || "",
        )
        .pipe(map((url) => ({ url, dashboardName: action.payload.name }))),
    ),
    map(dashboardUrlsSlice.actions.dashboardUrlSucceeded),
    catchEpicError((error: Error) =>
      dashboardUrlsSlice.actions.dashboardUrlFailed(error.message),
    ),
  );

export const dashboardUrlsEpics = [getConventionDashboardUrl];

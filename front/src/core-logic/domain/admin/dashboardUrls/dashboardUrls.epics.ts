import { concatMap, filter, map } from "rxjs";
import { AdminDashboardName } from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
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
    concatMap((action) =>
      adminGateway
        .getDashboardUrl$(action.payload, getAdminToken(state$.value))
        .pipe(
          map(({ url, name }) =>
            dashboardUrlsSlice.actions.dashboardUrlSucceeded({
              url,
              dashboardName: name as AdminDashboardName,
            }),
          ),
        ),
    ),
    catchEpicError((error: Error) =>
      dashboardUrlsSlice.actions.dashboardUrlFailed(error.message),
    ),
  );

export const dashboardUrlsEpics = [getConventionDashboardUrl];

import { filter, map, switchMap } from "rxjs";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
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
    filter(dashboardUrlsSlice.actions.conventionsDashboardUrlRequested.match),
    switchMap(() =>
      adminGateway.getDashboardConventionUrl(
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(dashboardUrlsSlice.actions.conventionsDashboardUrlSucceeded),
  );

export const dashboardUrlsEpics = [getConventionDashboardUrl];

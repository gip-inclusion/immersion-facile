import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DashboardName } from "shared";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";

export const useDashboard = (dashboardName: DashboardName) => {
  const dashboardUrls = useAppSelector(adminSelectors.dashboardUrls);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(dashboardUrlsSlice.actions.dashboardUrlRequested(dashboardName));
  }, []);

  return dashboardUrls[dashboardName] ?? undefined;
};

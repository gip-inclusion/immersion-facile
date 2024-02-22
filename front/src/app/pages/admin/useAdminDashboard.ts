import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { GetAdminDashboardParams } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";

export const useAdminDashboard = (params: GetAdminDashboardParams) => {
  const dashboardUrls = useAppSelector(adminSelectors.dashboardUrls.urls);
  const dashboardError = useAppSelector(adminSelectors.dashboardUrls.error);
  const dispatch = useDispatch();
  const initialParams = useRef(params);

  useEffect(() => {
    dispatch(
      dashboardUrlsSlice.actions.dashboardUrlRequested(initialParams.current),
    );
  }, [initialParams, dispatch]);

  return {
    url: dashboardUrls[params.name] ?? undefined,
    error: dashboardError,
  };
};

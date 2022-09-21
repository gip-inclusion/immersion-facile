import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import "./Admin.css";

const useConventionDashboard = () => {
  const conventionDashboardUrl = useAppSelector(
    adminSelectors.dashboardUrls.conventions,
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(dashboardUrlsSlice.actions.conventionsDashboardUrlRequested());
  }, []);

  return conventionDashboardUrl ?? undefined;
};

export const ConventionTab = () => {
  const conventionDashboardUrl = useConventionDashboard();

  return (
    <MetabaseView title="Gérer les conventions" url={conventionDashboardUrl} />
  );
};

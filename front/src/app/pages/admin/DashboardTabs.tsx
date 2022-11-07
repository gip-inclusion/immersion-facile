import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DashboardName } from "shared";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";

const useDashboard = (dashboardName: DashboardName) => {
  const dashboardUrls = useAppSelector(adminSelectors.dashboardUrls);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(dashboardUrlsSlice.actions.dashboardUrlRequested(dashboardName));
  }, []);

  return dashboardUrls[dashboardName] ?? undefined;
};

export const ConventionTab = () => {
  const conventionsDashboardUrl = useDashboard("conventions");
  return <MetabaseView title="Conventions" url={conventionsDashboardUrl} />;
};

export const EventsTab = () => {
  const eventsDashboardUrl = useDashboard("events");
  return <MetabaseView title="Evénements" url={eventsDashboardUrl} />;
};

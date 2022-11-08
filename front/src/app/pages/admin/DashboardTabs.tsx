import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DashboardName } from "shared";
import { Notification } from "react-design-system";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";

const useDashboard = (dashboardName: DashboardName) => {
  const dashboardState = useAppSelector(adminSelectors.dashboardUrls);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(dashboardUrlsSlice.actions.dashboardUrlRequested(dashboardName));
  }, []);

  return {
    url: dashboardState[dashboardName] ?? undefined,
    errorMessage: dashboardState.errorMessage,
  };
};

export const ConventionTab = () => {
  const { url, errorMessage: error } = useDashboard("conventions");
  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title="Conventions" url={url} />
  );
};

export const EventsTab = () => {
  const { url, errorMessage: error } = useDashboard("events");
  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title="Evénements" url={url} />
  );
};

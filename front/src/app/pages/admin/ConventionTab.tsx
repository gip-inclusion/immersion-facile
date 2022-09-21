import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import "./Admin.css";

const useConventionDashboard = () => {
  const conventionDashboardUrl = useAppSelector(
    adminSelectors.conventionsDashboardUrl,
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(adminSlice.actions.conventionsDashboardUrlRequested());
  }, []);

  return conventionDashboardUrl ?? undefined;
};

export const ConventionTab = () => {
  const conventionDashboardUrl = useConventionDashboard();

  return (
    <MetabaseView title="Gérer les conventions" url={conventionDashboardUrl} />
  );
};

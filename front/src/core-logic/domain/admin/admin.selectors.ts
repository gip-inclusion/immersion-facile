import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const adminStateSelector = createRootSelector((state) => state.admin);
const dashboardsSelector = createSelector(
  adminStateSelector,
  ({ dashboardUrls }) => dashboardUrls,
);

export const adminSelectors = {
  token: createSelector(adminStateSelector, ({ adminToken }) => adminToken),
  isAuthenticated: createSelector(
    adminStateSelector,
    ({ adminToken }) => adminToken !== null,
  ),
  isLoading: createSelector(adminStateSelector, ({ isLoading }) => isLoading),
  error: createSelector(
    adminStateSelector,
    ({ error }) => (error && knownErrors[error]) ?? error,
  ),
  sentEmails: createSelector(
    adminStateSelector,
    ({ sentEmails }) => sentEmails,
  ),
  conventionsDashboardUrl: createSelector(
    dashboardsSelector,
    ({ conventions }) => conventions,
  ),
};

const knownErrors: Record<string, string> = {
  "Request failed with status code 403":
    "Les identifiants ne sont pas corrects",
};

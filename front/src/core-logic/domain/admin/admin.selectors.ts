import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const adminStateSelector = createRootSelector((state) => state.admin);
const adminAuthSelector = createSelector(
  adminStateSelector,
  ({ adminAuth }) => adminAuth,
);
const notificationsStateSelector = createSelector(
  adminStateSelector,
  ({ notifications }) => notifications,
);
const dashboardState = createSelector(
  adminStateSelector,
  ({ dashboardUrls }) => dashboardUrls,
);

export const adminSelectors = {
  auth: {
    token: createSelector(adminAuthSelector, ({ adminToken }) => adminToken),
    isAuthenticated: createSelector(
      adminAuthSelector,
      ({ adminToken }) => adminToken !== null,
    ),
    isLoading: createSelector(adminAuthSelector, ({ isLoading }) => isLoading),
    error: createSelector(adminAuthSelector, ({ error }) => error),
  },
  notifications: {
    isLoading: createSelector(
      notificationsStateSelector,
      ({ isLoading }) => isLoading,
    ),
    error: createSelector(
      notificationsStateSelector,
      ({ error }) => (error && knownErrors[error]) ?? error,
    ),
    emails: createSelector(
      notificationsStateSelector,
      ({ lastEmails }) => lastEmails,
    ),
    sms: createSelector(notificationsStateSelector, ({ lastSms }) => lastSms),
  },
  dashboardUrls: {
    urls: createSelector(dashboardState, ({ urls }) => urls),
    error: createSelector(dashboardState, ({ errorMessage }) => errorMessage),
  },
};

const knownErrors: Record<string, string> = {
  "Request failed with status code 403":
    "Les identifiants ne sont pas corrects",
};

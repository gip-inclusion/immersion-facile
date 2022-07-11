import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const adminState = createRootSelector((state) => state.admin);

export const adminSelectors = {
  token: createSelector(adminState, ({ adminToken }) => adminToken),
  isAuthenticated: createSelector(
    adminState,
    ({ adminToken }) => adminToken !== null,
  ),
  isLoading: createSelector(adminState, ({ isLoading }) => isLoading),
  error: createSelector(
    adminState,
    ({ error }) => (error && knownErrors[error]) ?? error,
  ),
  sentEmails: createSelector(adminState, ({ sentEmails }) => sentEmails),
};

const knownErrors: Record<string, string> = {
  "Request failed with status code 403":
    "Les identifiants ne sont pas corrects",
};

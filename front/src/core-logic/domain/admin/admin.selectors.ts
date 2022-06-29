import { createSelector } from "@reduxjs/toolkit";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const adminState = createRootSelector((state) => state.admin);

export const adminSelectors = {
  isAuthenticated: createSelector(
    adminState,
    ({ isAuthenticated }) => isAuthenticated,
  ),
  isLoading: createSelector(adminState, ({ isLoading }) => isLoading),
  error: createSelector(
    adminState,
    ({ error }) => (error && knownErrors[error]) ?? error,
  ),
};

const knownErrors: Record<string, string> = {
  "Request failed with status code 403":
    "Les identifiants ne sont pas corrects",
};

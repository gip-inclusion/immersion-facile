import { createSelector } from "@reduxjs/toolkit";
import type { ConnectedUserJwt } from "shared";
import { createRootSelector } from "src/core-logic/storeConfig/store";
import { connectedUserSelectors } from "../connected-user/connectedUser.selectors";

const rootAuthSelector = createRootSelector((state) => state.auth);

const currentFederatedIdentity = createSelector(
  rootAuthSelector,
  (auth) => auth.federatedIdentityWithUser,
);

const afterLoginRedirectionUrl = createSelector(
  rootAuthSelector,
  (auth) => auth.afterLoginRedirectionUrl,
);

const isLoading = createSelector(rootAuthSelector, (auth) => auth.isLoading);
const isRequestingLoginByEmail = createSelector(
  rootAuthSelector,
  (auth) => auth.isRequestingLoginByEmail,
);
const isRequestingRenewExpiredJwt = createSelector(
  rootAuthSelector,
  (auth) => auth.isRequestingRenewExpiredJwt,
);
const requestedEmail = createSelector(
  rootAuthSelector,
  (auth) => auth.requestedEmail,
);

const isConnectedUser = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) =>
    federatedIdentity?.provider === "proConnect" ||
    federatedIdentity?.provider === "email",
);

const connectedUserJwt = createSelector(
  isConnectedUser,
  currentFederatedIdentity,
  (isConnectedUser, federatedIdentity) =>
    isConnectedUser
      ? (federatedIdentity?.token as ConnectedUserJwt)
      : undefined,
);

const isAdminConnected = createSelector(
  connectedUserSelectors.currentUser,
  isConnectedUser,
  (user, isConnectedUser) =>
    (isConnectedUser && user?.isBackofficeAdmin) ?? false,
);

export const authSelectors = {
  federatedIdentity: currentFederatedIdentity,
  isAdminConnected,
  isConnectedUser,
  connectedUserJwt,
  afterLoginRedirectionUrl,
  isLoading,
  isRequestingLoginByEmail,
  isRequestingRenewExpiredJwt,
  requestedEmail,
};

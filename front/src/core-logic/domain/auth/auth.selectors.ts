import { createSelector } from "@reduxjs/toolkit";
import { authFailed, type ConnectedUserJwt } from "shared";
import type { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { createRootSelector } from "src/core-logic/storeConfig/store";

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
const requestedEmail = createSelector(
  rootAuthSelector,
  (auth) => auth.requestedEmail,
);

const isPeConnected = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) =>
    federatedIdentity?.provider === "peConnect" &&
    federatedIdentity.token !== authFailed,
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

const userIsDefined = (
  federatedIdentity: FederatedIdentityWithUser | null,
): federatedIdentity is FederatedIdentityWithUser => {
  if (!federatedIdentity) return false;
  const { email } = federatedIdentity;
  return email !== "";
};

const connectedUser = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) => {
    if (!userIsDefined(federatedIdentity)) return;
    const { email, firstName, lastName } = federatedIdentity;
    return { email, firstName, lastName };
  },
);

export const authSelectors = {
  federatedIdentity: currentFederatedIdentity,
  isAdminConnected,
  isPeConnected,
  isConnectedUser,
  connectedUserJwt,
  connectedUser,
  afterLoginRedirectionUrl,
  isLoading,
  isRequestingLoginByEmail,
  requestedEmail,
};

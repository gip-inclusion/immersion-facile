import { createSelector } from "@reduxjs/toolkit";
import { ConnectedUserJwt, authFailed } from "shared";
import { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
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

const isPeConnected = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) =>
    federatedIdentity?.provider === "peConnect" &&
    federatedIdentity.token !== authFailed,
);

const isInclusionConnected = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) => federatedIdentity?.provider === "connectedUser",
);

const inclusionConnectToken = createSelector(
  isInclusionConnected,
  currentFederatedIdentity,
  (isInclusionConnected, federatedIdentity) =>
    isInclusionConnected
      ? (federatedIdentity?.token as ConnectedUserJwt)
      : undefined,
);

const isAdminConnected = createSelector(
  inclusionConnectedSelectors.currentUser,
  isInclusionConnected,
  (user, isInclusionConnected) =>
    (isInclusionConnected && user?.isBackofficeAdmin) ?? false,
);

const userIsDefined = (
  federatedIdentity: FederatedIdentityWithUser | null,
): federatedIdentity is FederatedIdentityWithUser => {
  if (!federatedIdentity) return false;
  const { email, firstName, lastName } = federatedIdentity;
  return email !== "" && firstName !== "" && lastName !== "";
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
  isInclusionConnected,
  inclusionConnectToken,
  connectedUser,
  afterLoginRedirectionUrl,
  isLoading,
};

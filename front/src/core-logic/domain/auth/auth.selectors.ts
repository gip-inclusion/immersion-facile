import { createSelector } from "@reduxjs/toolkit";
import { authFailed, ConventionFederatedIdentityString } from "shared";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const currentFederatedIdentity = createRootSelector(
  (state) => state.auth.federatedIdentity,
);

const conventionFederatedIdentityString = createSelector(
  currentFederatedIdentity,
  (federatedIdentity): ConventionFederatedIdentityString =>
    federatedIdentity?.provider === "peConnect"
      ? `${federatedIdentity.provider}:${federatedIdentity.token}`
      : "noIdentityProvider",
);

const isSuccessfullyPeConnected = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) =>
    federatedIdentity?.provider === "peConnect" &&
    federatedIdentity.token !== authFailed,
);

export const authSelectors = {
  federatedIdentity: currentFederatedIdentity,
  conventionFederatedIdentityString,
  isSuccessfullyPeConnected,
};

import { createSelector } from "@reduxjs/toolkit";
import { authFailed, ConventionFederatedIdentityString } from "shared";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const currentFederatedIdentity = createRootSelector(
  (state) => state.auth.federatedIdentity,
);

const conventionFederatedIdentityString = createSelector(
  currentFederatedIdentity,
  (federatedIdentity): ConventionFederatedIdentityString | null =>
    federatedIdentity?.provider === "peConnect"
      ? `${federatedIdentity.provider}:${federatedIdentity.token}`
      : null,
);

const isSuccessfullyPeConnected = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) =>
    federatedIdentity?.provider === "peConnect" &&
    federatedIdentity.token !== authFailed,
);

const isInclusionConnected = createSelector(
  currentFederatedIdentity,
  (federatedIdentity) => federatedIdentity?.provider === "inclusionConnect",
);

const inclusionConnectToken = createSelector(
  isInclusionConnected,
  currentFederatedIdentity,
  (isInclusionConnected, federatedIdentity) =>
    isInclusionConnected ? federatedIdentity?.token : undefined,
);

export const authSelectors = {
  federatedIdentity: currentFederatedIdentity,
  conventionFederatedIdentityString,
  isSuccessfullyPeConnected,
  isInclusionConnected,
  inclusionConnectToken,
};

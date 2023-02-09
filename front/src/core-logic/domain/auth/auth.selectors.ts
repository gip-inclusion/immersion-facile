import { createSelector } from "@reduxjs/toolkit";
import { authFailed } from "shared";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const currentFederatedIdentity = createRootSelector(
  (state) => state.auth.federatedIdentity,
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
  isSuccessfullyPeConnected,
  isInclusionConnected,
  inclusionConnectToken,
};

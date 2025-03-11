import type { ConnectedUserJwt } from "shared";
import type { RootState } from "src/core-logic/storeConfig/store";

export const getAdminToken = (state: RootState): ConnectedUserJwt => {
  const { federatedIdentityWithUser } = state.auth;
  if (!federatedIdentityWithUser) return "";
  if (federatedIdentityWithUser.provider !== "connectedUser") return "";
  return federatedIdentityWithUser.token;
};

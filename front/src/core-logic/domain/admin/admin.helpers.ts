import { ConnectedUserJwt } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

export const getAdminToken = (state: RootState): ConnectedUserJwt => {
  const { federatedIdentityWithUser } = state.auth;
  if (!federatedIdentityWithUser) return "";
  if (federatedIdentityWithUser.provider !== "connectedUser") return "";
  return federatedIdentityWithUser.token;
};

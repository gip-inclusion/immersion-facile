import type { ConnectedUserJwt } from "shared";
import type { RootState } from "src/core-logic/storeConfig/store";

export const getAdminToken = (state: RootState): ConnectedUserJwt => {
  const { federatedIdentity } = state.auth;
  if (!federatedIdentity) return "";
  if (
    federatedIdentity.provider !== "proConnect" &&
    federatedIdentity.provider !== "email"
  )
    return "";
  return federatedIdentity.token;
};

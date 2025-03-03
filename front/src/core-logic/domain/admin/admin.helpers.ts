import { ProConnectJwt } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

export const getAdminToken = (state: RootState): ProConnectJwt => {
  const { federatedIdentityWithUser } = state.auth;
  if (!federatedIdentityWithUser) return "";
  if (federatedIdentityWithUser.provider !== "proConnect") return "";
  return federatedIdentityWithUser.token;
};

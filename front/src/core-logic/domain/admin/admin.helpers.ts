import { InclusionConnectJwt } from "shared";
import { RootState } from "src/core-logic/storeConfig/store";

export const getAdminToken = (state: RootState): InclusionConnectJwt => {
  const { federatedIdentityWithUser } = state.auth;
  if (!federatedIdentityWithUser) return "";
  if (federatedIdentityWithUser.provider !== "inclusionConnect") return "";
  return federatedIdentityWithUser.token;
};

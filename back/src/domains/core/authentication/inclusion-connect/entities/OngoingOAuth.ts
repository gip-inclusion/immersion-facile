import { ExternalId, Flavor, InclusionConnectState } from "shared";

export type IdentityProvider = "inclusionConnect";
export type InclusionConnectOAuthJwt = Flavor<string, "OAuthJwt">;
export type InclusionConnectNonce = Flavor<string, "InclusionConnectNonce">;
export type OngoingOAuth = {
  userId?: string;
  externalId?: ExternalId;
  provider: IdentityProvider;
  state: InclusionConnectState;
  nonce: InclusionConnectNonce;
  accessToken?: InclusionConnectOAuthJwt; //TODO Pourquoi on le stocke en DB (on ne fait que le save)
};

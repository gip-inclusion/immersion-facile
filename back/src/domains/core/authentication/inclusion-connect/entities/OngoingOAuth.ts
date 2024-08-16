import { ExternalId, Flavor, IdentityProvider, OAuthState } from "shared";

export type OAuthJwt = Flavor<string, "OAuthJwt">;
export type OAuthNonce = Flavor<string, "InclusionConnectNonce">;
export type OngoingOAuth = {
  userId?: string;
  externalId?: ExternalId;
  provider: IdentityProvider;
  state: OAuthState;
  nonce: OAuthNonce;
  accessToken?: OAuthJwt; //TODO Pourquoi on le stocke en DB (on ne fait que le save)
};

export type IdentityProvider = "inclusionConnect";

export type OngoingOAuth = {
  userId?: string;
  externalId?: string;
  provider: IdentityProvider;
  state: string;
  nonce: string;
  accessToken?: string; //TODO Pourquoi on le stocke en DB (on ne fait que le save)
};

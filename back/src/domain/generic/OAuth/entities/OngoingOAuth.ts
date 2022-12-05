export type IdentityProvider = "inclusionConnect";

export type OngoingOAuth = {
  userId?: string;
  externalId?: string;
  provider: IdentityProvider;
  state: string;
  nonce: string;
  accessToken?: string;
};

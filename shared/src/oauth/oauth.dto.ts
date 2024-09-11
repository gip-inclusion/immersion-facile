export const oAuthProviders = ["InclusionConnect", "ProConnect"] as const;
export type OAuthProvider = (typeof oAuthProviders)[number];

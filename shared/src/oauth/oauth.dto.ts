export const oAuthGatewayProviders = [
  "inclusionConnect",
  "proConnect",
] as const;
export type OAuthGatewayProvider = (typeof oAuthGatewayProviders)[number];

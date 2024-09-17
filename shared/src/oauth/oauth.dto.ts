export const oAuthGatewayProviders = [
  "InclusionConnect",
  "ProConnect",
] as const;
export type OAuthGatewayProvider = (typeof oAuthGatewayProviders)[number];
